/* eslint-disable no-underscore-dangle */

import shell from 'shelljs';
import { mainStory, chalk } from 'storyboard';
import split from 'split';

const cd = (dir, { story = mainStory } = {}) => {
  story.trace(`Changing working directory to ${chalk.cyan.bold(dir)}...`);
  shell.cd(dir);
};

const exec = async (cmd, { story = mainStory, cwd } = {}) => {
  const prevWd = shell.pwd();
  let title = `Run cmd ${chalk.green.bold(cmd)}`;
  if (cwd) title += ` at ${chalk.green(cwd)}`;
  const ownStory = story.child({ title });
  try {
    if (cwd) cd(cwd, { story });
    const result = await _exec(cmd, ownStory);
    if (cwd) cd(prevWd, { story });
    return result;
  } finally {
    ownStory.close();
  }
};

const _exec = (cmd, story) => new Promise((resolve, reject) => {
  const child = shell.exec(cmd, { silent: true }, (code, stdout, stderr) => {
    if (code !== 0) {
      story.error(`Command failed [${code}]`);
      reject(new Error(`Command failed: ${cmd}`));
      return;
    }
    story.trace('Command completed successfully');
    resolve({ code, stdout, stderr });
  });
  const cmdName = cmd.split(' ')[0].slice(0, 10);
  child.stdout.pipe(split()).on('data', (line) => {
    story.info(cmdName, `| ${line}`);
  });
  child.stderr.pipe(split()).on('data', (line) => {
    if (line) story.error(cmdName, `| ${line}`);
  });
});

export {
  cd,
  exec,
};
