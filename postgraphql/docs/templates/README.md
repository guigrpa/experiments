
## Example queries

### GraphQL

```
{
  findPeople(criteria: "{\"firstName\": \"Guillermo\"}") { nodes {
    firstName
  }}
}
```

### SQL

```sql
SELECT * FROM forum_example.find_people('{"first_name": "Guillermo"}');
SELECT * FROM forum_example.find_people('{"first_name": "uille"}') LIMIT 1;
SELECT * FROM forum_example.find_people('{"first_name": "uillérmø"}') LIMIT 1;
SELECT * FROM forum_example.find_people('{"post:author_id:fk": {"headline": "My first post"}}') LIMIT 1;
SELECT * FROM forum_example.find_people('{"post:author_id:fk": {"headline": "My name is Luisa"}}') LIMIT 1;
SELECT * FROM forum_example.find_people('{"post:author_id:fk": {"comment:post_id:fk": {"body": "gibberish"}}}');
SELECT * FROM forum_example.find_people('{"post:author_id:fk": {"comment:post_id:fk": {"body": "best"}}}');
SELECT * FROM forum_example.find_posts('{"accepts_comments": null}');
```


## References

* http://stackoverflow.com/a/11007216/2773399 - on the use of the `unaccent` extension and performance implications (indexes). Note that no particular (premature?) perf optimisation is currently in place.
