-- ===================================================
-- Database and schemas
-- ===================================================
CREATE DATABASE forum_example;

\connect forum_example;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

DROP SCHEMA forum_example CASCADE;
DROP SCHEMA forum_example_private CASCADE;

CREATE SCHEMA forum_example;
CREATE SCHEMA forum_example_private;

-- ===================================================
-- Enum types
-- ===================================================
CREATE TYPE forum_example.post_topic AS enum (
  'discussion',
  'inspiration',
  'help',
  'showcase'
);

-- ===================================================
-- Generic functions
-- ===================================================
CREATE FUNCTION forum_example_private.set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  new.updated_at := current_timestamp;
  RETURN new;
END;
$$ LANGUAGE plpgsql;


-- ===================================================
-- Person
-- ===================================================
CREATE TABLE forum_example.person (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v1mc(),
  -- id              serial PRIMARY KEY,
  first_name      text NOT NULL CHECK (char_length(first_name) < 80),
  last_name       text CHECK (char_length(last_name) < 80),
  about           text,
  created_at      timestamp DEFAULT now(),
  updated_at      timestamp DEFAULT now()
);
COMMENT ON TABLE forum_example.person IS 'A user of the forum';
COMMENT ON COLUMN forum_example.person.about IS 'A short description about the user, written by himself';

CREATE TRIGGER person_updated_at BEFORE UPDATE
  ON forum_example.person
  FOR EACH ROW
  EXECUTE PROCEDURE forum_example_private.set_updated_at();

CREATE FUNCTION forum_example.person_full_name(person forum_example.person) RETURNS text AS $$
  SELECT person.first_name || ' ' || person.last_name
$$ LANGUAGE SQL STABLE;
COMMENT ON FUNCTION forum_example.person_full_name(forum_example.person) IS 'A person’s full name which is a concatenation of their first and last name';

-- ===================================================
-- Post
-- ===================================================
CREATE TABLE forum_example.post (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v1mc(),
  -- id              serial PRIMARY KEY,
  author_id       uuid NOT NULL REFERENCES forum_example.person(id),
  -- author_id       integer NOT NULL REFERENCES forum_example.person(id),
  headline        text NOT NULL CHECK (char_length(headline) < 280),
  body            text,
  topic           forum_example.post_topic,
  accepts_comments boolean,
  created_at      timestamp DEFAULT now(),
  updated_at      timestamp DEFAULT now()
);
COMMENT ON TABLE forum_example.post IS 'A forum post written by a user';
COMMENT ON COLUMN forum_example.post.author_id IS 'The id of the author person';
COMMENT ON COLUMN forum_example.post.topic IS 'A label assigned to the post';

CREATE TRIGGER post_updated_at BEFORE UPDATE
  ON forum_example.post
  FOR EACH ROW
  EXECUTE PROCEDURE forum_example_private.set_updated_at();

CREATE FUNCTION forum_example.post_summary(
  post forum_example.post,
  length int DEFAULT 50,
  omission text DEFAULT '…'
) RETURNS text AS $$
  SELECT CASE
    WHEN post.body IS NULL THEN NULL
    ELSE substr(post.body, 0, length) || omission
  END
$$ LANGUAGE SQL STABLE;
COMMENT ON FUNCTION forum_example.post_summary(forum_example.post, int, text) IS 'A truncated version of the body for summaries';

CREATE FUNCTION forum_example.search_posts(search text) RETURNS SETOF forum_example.post AS $$
  SELECT post.*
  FROM forum_example.post AS post
  WHERE post.headline ILIKE ('%' || search || '%') OR post.body ILIKE ('%' || search || '%')
$$ LANGUAGE SQL STABLE;
COMMENT ON FUNCTION forum_example.search_posts(text) IS 'Returns posts containing a given search term';

-- ===================================================
-- Comment
-- ===================================================
CREATE TABLE forum_example.comment (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v1mc(),
  commenter_id    uuid NOT NULL REFERENCES forum_example.person(id),
  post_id         uuid NOT NULL REFERENCES forum_example.post(id),
  body            text,
  created_at      timestamp DEFAULT now(),
  updated_at      timestamp DEFAULT now()
);
COMMENT ON TABLE forum_example.comment IS 'A forum comment written by a user';
COMMENT ON COLUMN forum_example.comment.commenter_id IS 'The id of the commenter person';
COMMENT ON COLUMN forum_example.comment.post_id IS 'The id of the post this comment refers to';

CREATE TRIGGER comment_updated_at BEFORE UPDATE
  ON forum_example.comment
  FOR EACH ROW
  EXECUTE PROCEDURE forum_example_private.set_updated_at();

-- ===================================================
-- Cross-cutting functions
-- ===================================================
CREATE FUNCTION forum_example.person_latest_post(person forum_example.person) RETURNS forum_example.post AS $$
  SELECT post.*
  FROM forum_example.post AS post
  WHERE post.author_id = person.id
  ORDER BY created_at DESC
  LIMIT 1
$$ LANGUAGE SQL STABLE;
COMMENT ON FUNCTION forum_example.person_latest_post(forum_example.person) IS 'Gets the latest post written by the person';

CREATE OR REPLACE FUNCTION forum_example.does_row_match(in_row json, criteria jsonb) RETURNS boolean AS $$
DECLARE
  found int = 0;
  attr text;
  is_match boolean;
  colon_pos int;
  colon_pos2 int;
  related_table text;
  related_fk text;
  related_criteria jsonb;
  related_query text;
  related_row record;
  related_count int;
BEGIN
  RAISE NOTICE '*** %: %', in_row->>'id', in_row;

  FOR attr IN SELECT jsonb_object_keys(criteria) LOOP
    colon_pos = strpos(attr, ':');

    -- 1. Apply local criteria
    IF colon_pos = 0 THEN
      RAISE NOTICE '- local attr: % (''%'') ?= ''%''', attr, in_row->>attr, criteria->>attr;
      IF
        ((in_row->>attr) IS NULL AND (criteria->>attr) IS NULL) OR
        ((in_row->>attr) = (criteria->>attr)) OR
        (unaccent((in_row->>attr)::text) ILIKE '%' || unaccent(criteria->>attr) || '%')
      THEN
        CONTINUE;
      END IF;
      RAISE NOTICE '  local attr: %: match NOK (null mismatch)', attr;
      RETURN FALSE;

    -- 2. Apply related criteria (attribute name examples: post:post_id (from comment) comment:post_id:fk (from post)
    ELSE
      related_table = substring(attr for colon_pos - 1);
      related_fk = substring(attr from colon_pos + 1);
      colon_pos2 = strpos(related_fk, ':');
      related_criteria = criteria->>attr;
      IF colon_pos2 > 0 THEN
        related_fk = substring(related_fk for colon_pos2 - 1);
      END IF;
      RAISE NOTICE '- related attr (% table via %) ?= %', related_table, related_fk, related_criteria;
      IF colon_pos2 > 0 THEN
        -- 1-to-N query (will find 0, 1 or more rows)
        related_query = format('SELECT * FROM forum_example.%I AS related WHERE related.%I = %L', related_table, related_fk, in_row->>'id');
      ELSE
        -- 1-to-1 query (will find 0, 1 rows)
        related_query = format('SELECT * FROM forum_example.%I AS related WHERE related.id = %L', related_table, in_row->>related_fk);
      END IF;
      RAISE NOTICE '  * related query: %', related_query;
      is_match = FALSE;
      FOR related_row IN EXECUTE related_query LOOP
        IF forum_example.does_row_match(row_to_json(related_row), related_criteria) THEN
          is_match = TRUE;
          EXIT;
        END IF;
      END LOOP;
      IF NOT is_match THEN
        RAISE NOTICE '  related attr: %: match NOK', attr;
        RETURN FALSE;
      END IF;
    END IF;
  END LOOP;

  RAISE NOTICE '*** %: match OK', in_row->>'id';
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION forum_example.find_people(criteria jsonb DEFAULT '{}') RETURNS SETOF forum_example.person AS $$
SELECT * FROM forum_example.person AS r WHERE forum_example.does_row_match(row_to_json(r), criteria);
$$ LANGUAGE sql STABLE;
COMMENT ON FUNCTION forum_example.find_people(jsonb) IS 'Returns people matching certain criteria';

CREATE OR REPLACE FUNCTION forum_example.find_posts(criteria jsonb DEFAULT '{}') RETURNS SETOF forum_example.post AS $$
SELECT * FROM forum_example.post AS r WHERE forum_example.does_row_match(row_to_json(r), criteria);
$$ LANGUAGE sql STABLE;
COMMENT ON FUNCTION forum_example.find_posts(jsonb) IS 'Returns posts matching certain criteria';

CREATE OR REPLACE FUNCTION forum_example.find_comments(criteria jsonb DEFAULT '{}') RETURNS SETOF forum_example.comment AS $$
SELECT * FROM forum_example.comment AS r WHERE forum_example.does_row_match(row_to_json(r), criteria);
$$ LANGUAGE sql STABLE;
COMMENT ON FUNCTION forum_example.find_comments(jsonb) IS 'Returns comments matching certain criteria';
