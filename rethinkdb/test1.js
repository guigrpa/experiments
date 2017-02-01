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
    mainStory.info(`Inserting documents into ${chalk.yellow.bold('authors')}...`);
    return r.table('authors').insert([
      {
        name: "William Adama",
        tv_show: "Battlestar Galactica",
        posts: [
          { title: "Decommissioning speech", content: "The Cylon War is long over..." },
          { title: "We are at war", content: "Moments ago, this ship received word..." },
          { title: "The new Earth", content: "The discoveries of the past few days..." },
        ]
      },
      { 
        name: "Laura Roslin", 
        tv_show: "Battlestar Galactica",
        posts: [
          { title: "The oath of office", content: "I, Laura Roslin, ..." },
          { title: "They look like us", content: "The Cylons have the ability..." },
        ],
      },
      { 
        name: "Jean-Luc Picard", 
        tv_show: "Star Trek TNG",
        posts: [
          { title: "Civil rights", content: "There are some words I've known since..." },
        ],
      },
    ]).run(conn)
    .then(() => mainStory.info('Finished inserting documents'));
  })
  .then(() => {
    return r.table('authors').count().run(conn)
    .then(result => mainStory.info(`There are currently ${chalk.cyan.bold(result)} documents in the table`));
  })
  .then(() => {
    mainStory.info(`Retrieving documents from ${chalk.yellow.bold('authors')}...`);
    return r.table('authors').run(conn)
    .then(cursor => cursor.toArray())
    .then(result => mainStory.info('', { attach: result }));
  })
  .then(() => process.exit());
});
