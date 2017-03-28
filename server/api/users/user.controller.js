'use strict';

const authService = require('../../lib/auth.service'),
  validate = require('../../lib/validate.utility'),
  reply = require('../../lib/reply.utility'),
  User = require('./user.model'),
  compose = require('composable-middleware'),
  moment = require('moment'),
  _ = require('lodash');

module.exports.all = function(req, res, next) {
  var query = {};
  if(req.query.hasOwnProperty('id')) {
    query._id = req.query.id;
  }
  if(req.query.hasOwnProperty('email')) {
    query['profile.email'] = req.query.email;
  }
  if(req.query.hasOwnProperty('name')) {
    query['profile.name'] = {$regex: req.query.name, $options: 'i'};
  }
  User.find(query, function(err, users) {
    if(err) {
      return next(err);
    } else {
      return reply(200, null, {total: users.length, data: {users: users}})(res);
    }
  });
};

module.exports.deactivateAccount = function(req, res, next) {
  User.findByIdAndUpdate(req.params.id, {active: false}, {new: true}, function(err, user) {
    if(err) {
      return next(err);
    } else if(!user) {
      return reply(404, 'User doesn\'t exists')(res);
    } else {
      return reply(200, 'Your account has been removed successfully')(res);
    }
  });
};

module.exports.self = function(req, res, next) {
};

module.exports.addToWatchlist = function(req, res, next) {
  User.findOneAndUpdate({_id: req.user._id, 'profile.watchlist': {$ne: req.body.symbol}},
    {$addToSet: {'profile.watchlist': req.body.symbol}}, {new: true},
    function(err, doc) {
      if(err) {
        return next(err);
      } else if(!doc) {
        return reply(409, `${req.body.symbol} is already present in your watchlist`)(res);
      } else {
        return reply(200, `${req.body.symbol} has been added to your watchlist`)(res);
      }
    });
};

module.exports.removeFromWatchlist = function(req, res, next) {
  User.findOneAndUpdate({_id: req.user._id, 'profile.watchlist': {$eq: req.params.symbol}},
    {$pull: {'profile.watchlist': req.params.symbol}}, {new: true},
    function(err, doc) {
      if(err) {
        return next(err);
      } else if(!doc) {
        return reply(404, `${req.params.symbol} is not present in your watchlist`)(res);
      } else {
        return reply(200, `${req.params.symbol} has been removed from your watchlist`)(res);
      }
    });
};

module.exports.buy = function(req, res, next) {
  if(req.user.profile.wallet >= (req.body.rate * req.body.quantity)) {
    User.findOneAndUpdate({_id: req.user._id, 'profile.portfolio.symbol': {$ne: req.body.symbol}},
      {$addToSet: {'profile.portfolio': {symbol: req.body.symbol, name: req.body.name}}}, {new: true},
      function(err, doc) {
        if(err) {
          return next(err);
        } else {
          User.findOneAndUpdate({_id: req.user._id, 'profile.portfolio.symbol': {$eq: req.body.symbol}},
            {
              $push: {
                'profile.portfolio.$.transactions': {
                  rate: req.body.rate,
                  quantity: req.body.quantity,
                  type: 'B'
                }
              }
            }, {new: true},
            function(err, doc) {
              if(err) {
                return next(err);
              } else {
                var index = doc.profile.portfolio.findIndex(function(current) {
                  return current.symbol === req.body.symbol;
                });
                var count = 0;
                var totalRate = 0;
                doc.profile.portfolio[index].transactions.forEach(function(current, index, arr) {
                  if(current.type === 'B') {
                    totalRate += current.rate;
                    count++;
                  }
                });
                totalRate /= count;
                var quantity = doc.profile.portfolio[index].totalQuantity += req.body.quantity,
                  wallet = doc.profile.wallet - (req.body.rate * req.body.quantity);
                User.findOneAndUpdate({_id: req.user._id, 'profile.portfolio.symbol': {$eq: req.body.symbol}},
                  {
                    $set: {
                      'profile.portfolio.$.totalBuyRate': totalRate,
                      'profile.portfolio.$.quantity': quantity,
                      'profile.portfolio.$.totalQuantity': quantity,
                      'profile.wallet': wallet
                    },
                  }, {new: true},
                  function(err, doc) {
                    if(err) {
                      return next(err);
                    } else {
                      return reply(200, `${req.body.symbol} has been bought and added to your portfolio`, {data: doc.profile})(res);
                    }
                  });
              }
            });
        }
      });
  } else {
    return reply(406, `${req.body.symbol} can't be bought due to insufficient balance`)(res);
  }
};

module.exports.sell = function(req, res, next) {
  var obj = req.user.profile.portfolio.find(function(current) {
    return current.symbol === req.body.symbol;
  });
  if(!obj) {
    return reply(406, `You don't have ${req.body.symbol} in your account`)(res);
  } else if(obj.totalQuantity >= req.body.quantity) {
    User.findOneAndUpdate({_id: req.user._id, 'profile.portfolio.symbol': {$eq: req.body.symbol}},
      {
        $push: {
          'profile.portfolio.$.transactions': {
            rate: req.body.rate,
            quantity: req.body.quantity,
            type: 'S'
          }
        }
      }, {new: true},
      function(err, doc) {
        if(err) {
          return next(err);
        } else {
          var index = doc.profile.portfolio.findIndex(function(current) {
            return current.symbol === req.body.symbol;
          });
          var count = 0;
          var totalRate = 0;
          doc.profile.portfolio[index].transactions.forEach(function(current, index, arr) {
            if(current.type === 'S') {
              totalRate += current.rate;
              count++;
            }
          });
          totalRate /= count;
          User.findOneAndUpdate({_id: req.user._id, 'profile.portfolio.symbol': {$eq: req.body.symbol}},
            {
              $set: {
                'profile.portfolio.$.status': (doc.profile.portfolio[index].totalSellRate > doc.profile.portfolio[index].totalBuyRate) ? 'P' :
                  /*(doc.profile.portfolio[index].totalSellRate < doc.profile.portfolio[index].totalBuyRate) ? 'L' : */'N',
                'profile.portfolio.$.totalSellRate': totalRate,
                'profile.portfolio.$.totalQuantity': doc.profile.portfolio[index].totalQuantity -= req.body.quantity,
                'profile.wallet': (doc.profile.wallet + (req.body.rate * req.body.quantity))
              },
            }, {new: true},
            function(err, doc) {
              if(err) {
                return next(err);
              } else {
                return reply(200, `${req.body.symbol} has been sold`, {data: doc.profile})(res);
              }
            });
        }
      });
  } else {
    return reply(406, `You don't have sufficient quantity of ${req.body.symbol}`)(res);
  }
};

module.exports.signup = function(req, res, next) {
  var params = {password: req.body.password};
  params.profile = _.pick(req.body, ['name', 'email', 'phone']);
  var user = new User(params);
  user.save(function(err, doc) {
    if(err) {
      err.status = 406;
      return next(err);
    } else {
      return reply(201, 'Your account has been created successfully. Please login to continue.')(res);
    }
  });
};

module.exports.login = function(req, res, next) {
  User.findOne({'profile.email': req.body.email}, function(err, user) {
    if(err) {
      return next(err);
    } else if(!user) {
      return reply(404, 'This email is not registered with us')(res);
    } else if(!user.active) {
      return reply(403, `Your account was deleted on ${moment(user.updatedAt).format('LLL')}`)(res);
    } else {
      user.compare(req.body.password, function(arePasswordsMatching) {
        if(arePasswordsMatching) {
          user.generateAuthToken(user.profile, (token) => {
            reply(200, 'You have logged in successfully', {token: token, profile: user.profile})(res);
          });
        } else {
          return reply(404, 'You have entered an incorrect password')(res);
        }
      });
    }
  });
};

module.exports.search = function(req, res, next) {
  var params = {};
  if(req.query.hasOwnProperty('email')) {
    if(validate.isEmail(req.query.email)) {
      params['profile.email'] = req.query.email;
    } else {
      return reply(406, 'Please provide a valid email id')(res);
    }
  }
  if(req.query.hasOwnProperty('phone')) {
    if(validate.isPhone(req.query.phone)) {
      params['profile.phone'] = req.query.phone;
    } else {
      return reply(406, 'Please provide a valid phone number')(res);
    }
  }
  if(_.isEmpty(params)) {
    return reply(406, 'Please specify query parameters')(res);
  } else {
    User.findOne(params, function(err, user) {
      if(err) {
        return next(err);
      } else if(!user) {
        return reply(200, 'Available')(res);
      } else {
        return reply(409, 'Not available')(res);
      }
    });
  }
};