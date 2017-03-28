'use strict';

const express = require('express'),
  AuthService = require('../../lib/auth.service'),
  controller = require('./user.controller'),
  User = require('./user.model'),
  router = express.Router();

// Admin Routes
router.get('/', /*AuthService.hasRole('admin'),*/ controller.all);
router.delete('/:id', AuthService.hasRole('admin'), controller.deactivateAccount);

// User Routes
router.get('/self', AuthService.hasRole('user'), controller.self);
router.put('/watchlist', AuthService.hasRole('user'), controller.addToWatchlist);
router.delete('/watchlist/:symbol', AuthService.hasRole('user'), controller.removeFromWatchlist);
router.put('/portfolio/buy', AuthService.hasRole('user'), function(req, res, next) {
  User.findById(req.user._id, function(err, user) {
    if(err) {
      return next(err);
    } else {
      req.user = user;
      next();
    }
  });
}, controller.buy);
router.put('/portfolio/sell', AuthService.hasRole('user'), function(req, res, next) {
  User.findById(req.user._id, function(err, user) {
    if(err) {
      return next(err);
    } else {
      req.user = user;
      next();
    }
  });
}, controller.sell);

// Open Routes
router.post('/', controller.signup);
router.post('/login', controller.login);
router.get('/search', controller.search);

module.exports = router;