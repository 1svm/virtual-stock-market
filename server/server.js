'use strict';

const config = require('./config/config'),
  http = require('http'),
  winston = require('winston'),
  express = require('express'),
  mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect(config.DB_URI, {config: {autoIndex: false}});
mongoose.connection.on('error', (err) => {
  winston.log('error', 'MongoDB connection error');
  process.exit(-1);
});

const app = express(),
  server = http.createServer(app),
  io = require('socket.io')(server);
require('./config/express')(app);
require('./config/routes')(app);
require('./config/error')(app);

server.listen(config.PORT, config.IP, () => {
  winston.log('info', 'Express server is listening on %s:%d, in %s mode', config.IP, config.PORT, config.ENV);
});