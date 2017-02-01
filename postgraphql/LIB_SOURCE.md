- 3 blocks
    - postgres (PgCatalog)
    - interface (Inventory)
    - graphql
- ... plus `postgraphql`

### Create PostGraphQL schema (postgraphql/schema/createPostGraphQLSchema)

- Introspect the PG database, generating a PgCatalog (    postgres/introspection/introspectDatabase): namespace, classes, attributes, types, constraints, procedures
- Add the PgCatalog to the Inventory, extracting collections and relations (postgres/inventory/addPgCatalogToInventory) -- see dedicated in `interface`
- Extract user hooks from the PgCatalogue, classifying them in:
    - Mutation procedures
    - Query procedures
    - Object-type procedures
- Create GraphQL schema, based on the Inventory and the hooks (graphql/schema/createGqlSchema) -- see below

### Create GraphQL schema (graphql/schema/createGqlSchema)

- Node field
- Inventory collections
- Query hooks
- Query (special case), nested 1 level down
