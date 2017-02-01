CREATE OR REPLACE FUNCTION forum_example.find_rows(table_type anyelement, query text, criteria jsonb, max_to_find int DEFAULT 0) RETURNS SETOF anyelement AS $$
DECLARE
  row record;
  found int = 0;
  json_row jsonb;
  attr text;
  is_match boolean;
  colon_pos int;
  colon_pos2 int;
  related_table text;
  related_fk text;
  related_criteria jsonb;
  related_query text;
  related_count int;
BEGIN
  RAISE NOTICE '*** %: %', pg_typeof(table_type), query;
  FOR row IN
    EXECUTE query
  LOOP
    json_row = row_to_json(row);  -- use to_jsonb() on higher PG
    is_match = TRUE;
    RAISE NOTICE '% %: %', pg_typeof(table_type), row.id, json_row;

    FOR attr IN SELECT jsonb_object_keys(criteria) LOOP
      colon_pos = strpos(attr, ':');

      -- 1. Apply local criteria
      IF colon_pos = 0 THEN
        -- TODO: Improve checks:
        -- - Use lowercase, no-diacritic substring comparison for text, equality for other types
        -- - Allow <, > operators somehow...
        RAISE NOTICE '- local attr: % (%) = %?', attr, json_row->>attr, criteria->>attr;
        IF
          ((json_row->>attr) IS NULL AND (criteria->>attr) IS NOT NULL) OR
          ((json_row->>attr) IS NOT NULL AND (criteria->>attr) IS NULL) OR
          ((json_row->>attr) <> (criteria->>attr))
        THEN
          is_match = FALSE;
          EXIT;
        END IF;

      -- 2. Apply related criteria (attribute name examples: post:post_id (from comment) comment:post_id:fk (from post)
      ELSE
        related_table = substring(attr for colon_pos - 1);
        related_fk = substring(attr from colon_pos + 1);
        colon_pos2 = strpos(related_fk, ':');
        related_criteria = criteria->>attr;
        IF colon_pos2 > 0 THEN
          related_fk = substring(related_fk for colon_pos2 - 1);
        END IF;
        RAISE NOTICE '- related attr (% table via %): %?', related_table, related_fk, related_criteria;
        IF colon_pos2 > 0 THEN
          -- 1-to-N query (will find 0, 1 or more rows)
          related_query = format('SELECT * FROM forum_example.%I AS related WHERE related.%I = %L', related_table, related_fk, row.id);
        ELSE
          -- 1-to-1 query (will find 0, 1 rows)
          related_query = format('SELECT * FROM forum_example.%I AS related WHERE related.id = %L', related_table, json_row->>related_fk);
        END IF;
        RAISE NOTICE '  * related query: %', related_query;
        -- Based on this BRILLIANT solution (at the end of this SO answer):
        -- http://stackoverflow.com/questions/11740256/refactor-a-pl-pgsql-function-to-return-the-output-of-various-select-queries/11751557#11751557
        EXECUTE format('SELECT count(*) FROM forum_example.find_rows(NULL::forum_example.%s, %L, %L, 1)', related_table, related_query, related_criteria)
          INTO related_count;
        RAISE NOTICE '  * related count: %', related_count;
        IF (related_count = 0) THEN
          is_match = FALSE;
          EXIT;
        END IF;
      END IF;
    END LOOP;

    -- 3. Output record if it matches all criteria; if bailout is enabled, exit as soon as one record is found
    IF is_match THEN
      found = found + 1;
      RETURN NEXT row;
      IF (max_to_find > 0) AND (found >= max_to_find) THEN
        EXIT;
      END IF;
    END IF;
  END LOOP;
  RETURN;
END;
$$ LANGUAGE plpgsql STABLE;

-- Simpler SQL version (see PL/pgSQL version below)
CREATE OR REPLACE FUNCTION forum_example.find_people(criteria jsonb, max_to_find int DEFAULT 0) RETURNS SETOF forum_example.person AS $$
SELECT * FROM forum_example.find_rows(NULL::forum_example.person, 'SELECT * FROM forum_example.person', criteria, max_to_find);
$$ LANGUAGE sql STABLE;
COMMENT ON FUNCTION forum_example.find_people(jsonb, int) IS 'Returns people matching certain criteria';

CREATE OR REPLACE FUNCTION forum_example.find_posts(criteria jsonb, max_to_find int DEFAULT 0) RETURNS SETOF forum_example.post AS $$
SELECT * FROM forum_example.find_rows(NULL::forum_example.post, 'SELECT * FROM forum_example.post', criteria, max_to_find);
$$ LANGUAGE sql STABLE;
COMMENT ON FUNCTION forum_example.find_posts(jsonb, int) IS 'Returns posts matching certain criteria';

CREATE OR REPLACE FUNCTION forum_example.find_comments(criteria jsonb, max_to_find int DEFAULT 0) RETURNS SETOF forum_example.comment AS $$
SELECT * FROM forum_example.find_rows(NULL::forum_example.comment, 'SELECT * FROM forum_example.comment', criteria, max_to_find);
$$ LANGUAGE sql STABLE;
COMMENT ON FUNCTION forum_example.find_comments(jsonb, int) IS 'Returns comments matching certain criteria';
