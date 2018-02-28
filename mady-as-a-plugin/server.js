const http = require('http');
const express = require('express');
const cookieParser = require('cookie-parser');
const initMady = require('mady/lib/serverPlugin').default;

const PORT = 3000;

const expressApp = express();
expressApp.use(cookieParser());
expressApp.use(express.static('public'));
expressApp.use(express.static('node_modules/mady/lib/public'));
const httpServer = http.createServer(expressApp);
httpServer.listen(PORT);
console.log(`Listening at port ${PORT}`);

initMady({ expressApp, httpServer });
