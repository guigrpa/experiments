const ms = require('ms');
const { mainStory, chalk, addListener, removeAllListeners } = require('storyboard');
const { default: consoleListener } = require('storyboard-listener-console');
const { default: wsServerListener } = require('storyboard-listener-ws-server');

const NUM_MESSAGES = 1e4;

const delay = millis => new Promise(resolve => {
  setTimeout(resolve, millis);
});

const run = () => {
  const originalConsoleLog = console.log;
  console.log = () => {};

  tic('total');

  // No listener
  delay(200);
  tic('no listeners, trace level (filtered out early)')
  for (let i = 0; i < NUM_MESSAGES; i++) {
    logMessage('trace');
  }
  toc('no listeners, trace level (filtered out early)', NUM_MESSAGES);

  // No listener
  delay(200);
  tic('no listeners, warn level')
  for (let i = 0; i < NUM_MESSAGES; i++) {
    logMessage();
  }
  toc('no listeners, warn level', NUM_MESSAGES);

  // Console listener
  addListener(consoleListener);
  delay(200); // Allow previous messages to be dumped on the new listener
  tic('console listener')
  for (let i = 0; i < NUM_MESSAGES; i++) {
    logMessage();
  }
  toc('console listener', NUM_MESSAGES);

  // WS listener
  removeAllListeners();
  addListener(wsServerListener);
  delay(200); // Allow previous messages to be dumped on the new listener
  tic('WS server listener')
  for (let i = 0; i < NUM_MESSAGES; i++) {
    logMessage();
  }
  toc('WS server listener', NUM_MESSAGES);

  toc('total');

  console.log = originalConsoleLog;
  flushResults();
  process.exit(0);
};

const logMessage = (level = 'info') => {
  mainStory[level]('Message');
}

let t0 = {};
const results = [];
const tic = (key) => {
  t0[key] = new Date().getTime();
};
const toc = (key, numMessages) => {
  const t1 = new Date().getTime();
  const delta = t1 - t0[key];
  results.push(`Elapsed ${ms(delta)} - ${key}`)
  if (numMessages) {
    results.push(`  - Per message: ${ms(delta / numMessages)}`)
  }
};
const flushResults = () => {
  results.forEach(str => console.log(str));
};

run();