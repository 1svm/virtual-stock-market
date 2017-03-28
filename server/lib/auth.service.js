'use strict';

const reply = require('../lib/reply.utility'),
  config = require('../config/config'),
  User = require('../api/users/user.model'),
  compose = require('composable-middleware'),
  uuidV4 = require('uuid/v4'),
  jwt = require('jsonwebtoken'),
  expressJwt = require('express-jwt'),
  winston = require('winston');

let validateJwt = expressJwt({secret: config.JWT_SECRET, issuer: config.JWT_ISSUER});

function signToken(payload, cb) {
  jwt.sign(payload, config.JWT_SECRET, {
    issuer: config.JWT_ISSUER,
    expiresIn: config.JWT_EXPIRY,
    jwtid: uuidV4()
  }, function(err, token) {
    if(err) {
      winston.log('error', 'JWT sign error');
      return next(err);
    } else {
      return cb(token);
    }
  });
}

function verifyToken(encodedToken, cb) {
  jwt.verify(encodedToken, config.JWT_SECRET, {issuer: config.JWT_ISSUER}, function(err, payload) {
    if(err) {
      winston.log('error', 'JWT verify error');
      return next(err);
    } else {
      return cb(payload);
    }
  });
}

function isAuthenticated() {
  return (req, res, next) => {
    if(req.query.hasOwnProperty('token')) {
      req.headers.authorization = `Bearer ${req.query.token}`;
    }
    validateJwt(req, res, next);
  };
}

function isAuthorized(role) {
  return function(req, res, next) {
    let err = new Error('Not authorized');
    err.status = 401;
    if(!req.user.role) {
      return next(err);
    } else if(config.ROLES.indexOf(req.user.role) <= config.ROLES.indexOf(role)) {
      return next();
    } else {
      return next(err);
    }
  };
}

function hasRole(role) {
  return compose().use(isAuthenticated()).use(isAuthorized(role));
}

module.exports.signToken = signToken;
module.exports.verifyToken = verifyToken;
module.exports.isAuthenticated = isAuthenticated;
module.exports.hasRole = hasRole;