'use strict';

const reply = require('../lib/reply.utility'),
  config = require('../config/config');

module.exports = function(app) {
  if(config.ENV !== 'production') {
    app.use(function(req, res) {
      reply(404, 'This request is not valid')(res);
    });
    app.use(function(err, req, res, next) {
      reply(err.status || 500, err.message || 'Development Environment', {error: err})(res);
    });
  }
  app.use(function(req, res) {
    res.status(404).send();
  });
  app.use(function(err, req, res, next) {
    res.status(err.status || 500).send();
  });
};