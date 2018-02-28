import React from 'react';
import ReactDOM from 'react-dom';
import createRelayEnvironment from 'mady/lib/client/gral/relay';
import MadyApp from 'mady/lib/client/components/aaApp';

ReactDOM.render(
  <div>
    <h2>Mady-as-a-plugin experiment</h2>
    <p>
      <a href="/mady">Go to stand-alone Mady</a>
    </p>
    <MadyApp relayEnvironment={createRelayEnvironment()} />
  </div>,
  document.getElementById('app')
);
