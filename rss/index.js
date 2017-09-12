/* eslint-disable no-console */

const fetch = require('omni-fetch');
const RssParser = require('feedparser');
const intoStream = require('into-stream');
const delay = require('delay');
// import fetchRssAndParse from './fetchRssAndParse';

const NUM_TRIES = 10;
const RETRY_DELAY = 100;

const run = async () => {
  let result;
  for (let i = 0; i < NUM_TRIES; i++) {
    result = await fetch('http://heart.bmj.com/rss/current.xml');
    console.log(result.status);
    if (result.status === 200) break;
    await delay(RETRY_DELAY);
  }
  if (result.status !== 200) return;
  const xml = await result.text();
  const items = await parse(xml);
  console.log(`#items: ${items.length}`);
};

const parse = xml =>
  new Promise((resolve, reject) => {
    const rssParser = new RssParser();
    const items = [];
    rssParser.on('error', err => {
      console.error('Error parsing', err);
      reject(err);
    });
    rssParser.on('readable', function rxFeed() {
      const stream = this;
      let item;
      while ((item = stream.read())) {
        console.log(`- ${item.title}`);
        items.push(item);
      }
    });
    rssParser.on('end', () => {
      resolve(items);
    });
    console.log('RSS parser ready to accept data');
    intoStream(xml).pipe(rssParser);
  });

run();
