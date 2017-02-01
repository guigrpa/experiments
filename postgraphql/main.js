const http = require('http');
const { postgraphql } = require('postgraphql');

const pgConfig = "postgresql://postgres:s3cret@localhost:5432/forum_example";
const options = {
  graphiql: true,
};
http.createServer(postgraphql(pgConfig, 'forum_example', options)).listen(5000);
