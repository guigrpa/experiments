/* eslint-disable no-console */

const fetch = require('omni-fetch');
const RssParser = require('feedparser');
const intoStream = require('into-stream');
const delay = require('delay');

const NUM_TRIES = 10;
const RETRY_DELAY = 100;

const fetchRssAndParse = async url => {
  const xml = await fetchRss(url);
  const items = await parse(xml);
  console.log(`#items: ${items.length}`);
};

const fetchRss = async url => {
  let result;
  for (let i = 0; i < NUM_TRIES; i++) {
    result = await fetch(url);
    console.log(result.status);
    if (result.status === 200) break;
    await delay(RETRY_DELAY);
  }
  if (result.status !== 200) throw new Error(`FETCH_FAILED ${result.status}`);
  const xml = await result.text();
  return xml;
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
      let rawItem;
      while ((rawItem = stream.read())) {
        const item = parseItem(rawItem);
        console.log(`- ${item.title}`);
        items.push(item);
      }
    });
    rssParser.on('end', () => {
      resolve(items);
    });
    intoStream(xml).pipe(rssParser);
  });

const parseItem = rawItem => ({ title: rawItem.title });

fetchRssAndParse('http://heart.bmj.com/rss/current.xml');
