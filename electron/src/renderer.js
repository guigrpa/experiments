import fs from 'fs';
import React from 'react';
import ReactDOM from 'react-dom';

const pkg = fs.readFileSync('package.json', 'utf8');

const elApp = (
  <div>
    <h3>Hello, React!</h3>
    <div>
      Versions: Node v{process.versions.node},
      Chrome v{process.versions.chrome},
      Electron v{process.versions.electron}
    </div>
    <div>Here's the package.json:</div>
    <pre>{pkg.slice(0, 100)}...</pre>
  </div>
);

ReactDOM.render(elApp, document.getElementById('app'));
