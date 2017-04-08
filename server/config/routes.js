'use strict';

module.exports = function(app) {
  app.use('/api/v1/users', require('../api/users/index'));
  app.use('/ds', function(req, res, next) {
    res.send('hello');
//    res.redirect('https://drive.google.com/uc?id=0By9IUkICpkBNU05ISkRwbTlOM1U&export=download');
  });
};