'use strict';

const path = require('path'),
  hpp = require('hpp'),
  cors = require('cors'),
  helmet = require('helmet'),
  express = require('express'),
  bodyParser = require('body-parser'),
  compression = require('compression'),
  cookieParser = require('cookie-parser'),
  config = require('../config/config');

module.exports = function(app) {
  app.disable('etag');
  app.disable('automatic 304s');
  if(config.ENV === 'development') {
    app.use(require('morgan')('dev'));
  }
  app.use(cors());
  app.use(compression());
  app.use(helmet());
  app.use(helmet.frameguard({action: 'deny'}));
  app.use(helmet.referrerPolicy());
  app.use(helmet.ieNoOpen());
  app.use(helmet.noCache());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json());
  app.use(hpp());
  app.use(cookieParser());
  app.use(express.static(config.CLIENT_PATH));
};