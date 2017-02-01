'use strict';

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var pkg = _fs2.default.readFileSync('package.json', 'utf8');

var elApp = _react2.default.createElement(
  'div',
  null,
  _react2.default.createElement(
    'h3',
    null,
    'Hello, React!'
  ),
  _react2.default.createElement(
    'div',
    null,
    'Versions: Node v',
    process.versions.node,
    ', Chrome v',
    process.versions.chrome,
    ', Electron v',
    process.versions.electron
  ),
  _react2.default.createElement(
    'div',
    null,
    'Here\'s the package.json:'
  ),
  _react2.default.createElement(
    'pre',
    null,
    pkg.slice(0, 100),
    '...'
  )
);

_reactDom2.default.render(elApp, document.getElementById('app'));