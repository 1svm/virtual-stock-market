'use strict';

module.exports = function(app) {
  app.use('/api/v1/users', require('../api/users/index'));
};