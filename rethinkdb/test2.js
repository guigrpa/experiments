const r = require('rethinkdb');
const { mainStory, chalk } = require('storyboard');
r.connect({ host: 'localhost', port: 28015 })
.then(conn => {
  mainStory.info('Connected to RethinkDB');
  return Promise.resolve()
  .then(() => {
    mainStory.info(`Creating table ${chalk.yellow.bold('authors')}...`);
    return r.db('test').tableCreate('authors').run(conn)
    .catch(err => mainStory.warn('Table could not be created. Did it already exist?'));
  })
  .then(() => {
    return r.table('authors').count().run(conn)
    .then(result => mainStory.info(`There are currently ${chalk.cyan.bold(result)} documents in the table`));
  })
  /*
  .then(() => {
    return r.table('authors').changes().run(conn)
    .then(() => {
      mainStory.info('Called')
    });
  });
  */
  .then(() => {
    return r.table('authors').changes({ includeTypes: true }).run(conn)
    .then(cursor => {
      mainStory.debug('Got a cursor!');
      cursor.each(function(err, row) {
        if (err) throw err;
        mainStory.info(`Table ${chalk.yellow.bold('authors')} was updated!`, { attach: row });
      });
    });
  });
});
