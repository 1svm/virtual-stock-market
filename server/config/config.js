'use strict';

const path = require('path'),
  winston = require('winston');

winston.add(winston.transports.File, {
  prettyPrint: true,
  timestamp: true,
  json: true,
  filename: 'winston.log',
  level: 'info'
});

const ENV = process.env.NODE_ENV || 'development';

module.exports = {
  DB_URI: (function() {
    switch(ENV) {
      case 'production':
        winston.remove(winston.transports.Console);
        return process.env.MONGODB_URI;
        break;
      case 'development':
        require('dotenv').config();
        return process.env.MONGODB_DEVELOPMENT_URI;
        break;
      case 'testing':
        require('dotenv').config();
        return process.env.MONGODB_TESTING_URI;
        break;
    }
  }()),
  ENV: ENV,
  IP: process.env.IP,
  PORT: process.env.PORT,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_ISSUER: process.env.JWT_ISSUER,
  JWT_EXPIRY: process.env.JWT_EXPIRY,
  ROLE: {GUEST: 'guest', USER: 'user', ADMIN: 'admin'},
  ROLES: ['admin', 'user', 'guest'],
  ROOT_PATH: path.join(__dirname, '..', '..'),
  CLIENT_PATH: path.join(__dirname, '..', '..', 'client')
};