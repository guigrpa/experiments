- [x] Add FROM clause
- [x] Namespace orderBy fields
- [x] Add DISTINCT
- [x] Update collection paginator queries
- [x] Update procedure paginator
- [ ] Fix, add tests
- Is it correct to filter out NULL values in fields that belong to the sort set? Open issue?

- [ ] Sorting approach, can we make it compatible with postgraphql?
  - https://github.com/calebmer/postgraphql/issues/224 (way to implement multiple sorting orders for procedures INSIDE postgraphql)

- [ ] Are there postgraphql conventions for making object fields non-writable (don't mass-assign)/non-readable (don't publish)?

- [ ] Modularise:
  - [ ] Add some docs
  - [ ] Add tests (based on my own populate, etc)
- [x] Disable RAISE NOTICEs (do they affect perf?)
- [ ] Include/omit (FMPro-like)

Useful:

node_modules\.bin\ts-node --ignore node_modules --disableWarnings src/postgraphql/cli.ts --schema forum_example -c postgres://postgres:s3cret@localhost:5432/forum_example -C resources/exampleConnectionFilter

https://gitter.im/calebmer/postgraphql


$ psql -U postgres -f schema.sql
$ psql -U postgres -d forum_example -f populate.sql


PostgraphQL limit:

* Can't sort by a field in a related table, or by multiple fields.
* For custom SRFs (such as our own), we lose the ability to paginate with cursors.


Way ahead:

MOTIVATION: We want to add flexibility to filtering (multi-table, multi-field, non-equality comparisons, etc.) without losing the ability to paginate, at least when sorting by the first table's fields.

* STEP 1: Add CLI argument: matcher = `forum_example.match`. If defined, the `condition` field in connections turns to type `json`, and is passed, along with the JSON representation of the row, to a given matcher. That matcher is used in the `where` clause. AN EXAMPLE matcher is included (under resources) in the postgraphql project (based on the one I already have). The user can install it manually in his database

* This way, not only entry-level connections get the ability to filter by fields in related tables, but also nested connections! And by leaving the matching to the database, the user can implement custom criteria (not only equality)

* Beyond step 1:

    - Automatically install matcher (just as it's done with the watch fixtures).

    - We'll still have the problem of multi-table, multi-field sort. That could also be solved at postgraphql level. If the user chooses a multi-table sort (through a graphql interface that doesn't exist yet), he would limit himself to offset-based, cursorless pagination
