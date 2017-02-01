CREATE OR REPLACE FUNCTION forum_example.find_rows(table_type anyelement, criteria jsonb) RETURNS SETOF anyelement AS $$
-- BRILLIANT (solution at the end of this SO answer):
-- http://stackoverflow.com/questions/11740256/refactor-a-pl-pgsql-function-to-return-the-output-of-various-select-queries/11751557#11751557
DECLARE
  row record;
  json_row jsonb;
  attr text;
  is_match boolean;
  colon_pos int;
BEGIN
  FOR row IN
    EXECUTE format('SELECT * FROM %s', pg_typeof(table_type))
  LOOP
    json_row = row_to_json(row);  -- use to_jsonb() on higher PG
    is_match = TRUE;
    RAISE NOTICE 'row %: %', row.id, json_row;

    FOR attr IN SELECT jsonb_object_keys(criteria) LOOP
      colon_pos = position(':' in attr);

      -- 1. Apply local criteria
      IF (colon_pos = 0) THEN
        -- TODO: Improve checks:
        -- - Use lowercase, no-diacritic substring comparison for text, equality for other types
        -- - Allow <, > operators somehow...
        RAISE NOTICE '- local attr: % (%) = %?', attr, json_row->>attr, criteria->>attr;
        IF (json_row->>attr) <> (criteria->>attr) THEN
          is_match = FALSE;
          EXIT;
        END IF;

      -- 2. Apply related criteria
      ELSE
        RAISE NOTICE '- related attr: % (%) = %?', attr, json_row->>attr, criteria->>attr;

      END IF;
    END LOOP;

    -- 3. Output record if it matches all criteria
    IF is_match THEN
      RETURN NEXT row;
    END IF;
  END LOOP;
  RETURN;
END;
$$ LANGUAGE plpgsql STABLE;

-- Simpler SQL version (see PL/pgSQL version below)
CREATE OR REPLACE FUNCTION forum_example.find_people(criteria jsonb)
RETURNS SETOF forum_example.person AS $$
SELECT * FROM forum_example.find_rows(NULL::forum_example.person, criteria);
$$ LANGUAGE sql STABLE;
COMMENT ON FUNCTION forum_example.find_people(jsonb) IS 'Returns people matching certain criteria';

CREATE OR REPLACE FUNCTION forum_example.find_posts(criteria jsonb)
RETURNS SETOF forum_example.post AS $$
SELECT * FROM forum_example.find_rows(NULL::forum_example.post, criteria);
$$ LANGUAGE sql STABLE;
COMMENT ON FUNCTION forum_example.find_posts(jsonb) IS 'Returns posts matching certain criteria';

CREATE OR REPLACE FUNCTION forum_example.find_comments(criteria jsonb)
RETURNS SETOF forum_example.comment AS $$
SELECT * FROM forum_example.find_rows(NULL::forum_example.comment, criteria);
$$ LANGUAGE sql STABLE;
COMMENT ON FUNCTION forum_example.find_comments(jsonb) IS 'Returns comments matching certain criteria';
