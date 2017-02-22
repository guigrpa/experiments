const { terminal: term } = require('terminal-kit');
const chalk = require('chalk');

const showSize = () => {
  term.moveTo(1, 2).eraseLine();
  term(`w=${term.width}, h=${term.height}\n`);
  resetCursorPos();
};

const showKey = (name) => {
  term.moveTo(1, 3).eraseLine();
  term(`key=${name}`);
  resetCursorPos();
}

const refresh = () => {
  term.moveTo(1, 1).eraseLine();
  term(`Hello, ${chalk.cyan('world')}!\n`);
  showSize();
};

const start = () => {
  term.grabInput();
  term.on('resize', showSize);
  term.on('key', (name) => {
    if (name === 'CTRL_C') process.exit(0);
    showKey(name);
  });

  setInterval(refresh, 400);
};

const quit = () => {
  resetCursorPos();
  process.exit(0);
};

const resetCursorPos = () => {
  term.moveTo(1, term.height);
};

start();