'use strict';

const config = require('../../config/config'),
  AuthService = require('../../lib/auth.service'),
  validate = require('../../lib/validate.utility'),
  low = require('lowdb'),
  fileAsync = require('lowdb/lib/storages/file-async'),
  mongoose = require('mongoose'),
  bcrypt = require('bcryptjs');

let db = low('db.json', {storage: fileAsync});
db.defaults({passwords: []}).write();

let UserSchema = new mongoose.Schema({
  profile: {
    name: {
      type: String,
      required: true,
      trim: true,
      validate: [validate.isName, 'Invalid name']
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: [validate.isEmail, 'Invalid email address']
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      validate: [validate.isPhone, 'Invalid phone number']
    },
    role: {
      type: String,
      enum: config.ROLES,
      default: config.ROLE.USER
    },
    wallet: {
      type: Number,
      min: 0,
      default: 50000
    },
    watchlist: [String],
    portfolio: [{
      _id: false,
      symbol: String,
      name: String,
      totalBuyRate: {
        type: Number,
        min: 0,
        default: 0
      },
      totalSellRate: {
        type: Number,
        min: 0,
        default: 0
      },
      quantity: {
        type: Number,
        min: 0,
        default: 0
      },
      totalQuantity: {
        type: Number,
        min: 0,
        default: 0
      },
      status: {
        type: String,
        enum: ['P', 'L', 'N'],
        default: 'N'
      },
      active: {
        type: Boolean,
        default: true
      },
      transactions: [{
        _id: false,
        rate: {
          type: Number,
          min: 0,
          required: true
        },
        quantity: {
          type: Number,
          min: 0,
          required: true
        },
        type: {
          type: String,
          enum: ['B', 'S'],
          required: true
        },
        performedAt: {
          type: Date,
          default: Date.now
        }
      }]
    }]
  },
  password: {
    type: String,
    required: true,
    validate: [validate.isPassword, 'Invalid password']
  },
  active: {
    type: Boolean,
    default: true
  }/*,
   tokens: [{
   ip: {
   type: String,
   required: true
   },
   token: {
   type: String,
   required: true
   }
   }]*/
}, {timestamps: true});

UserSchema.path('profile.email').validate(function(value, respond) {
  this.constructor.findOne({'profile.email': value}, function(err, user) {
    if(err) {
      return next(err);
    } else if(user) {
      return respond(false);
    } else {
      return respond(true);
    }
  });
}, 'This email is already registered with us');

UserSchema.path('profile.phone').validate(function(value, respond) {
  this.constructor.findOne({'profile.phone': value}, function(err, user) {
    if(err) {
      return next(err);
    } else if(user) {
      return respond(false);
    } else {
      return respond(true);
    }
  });
}, 'This phone is already registered with us');

UserSchema.pre('save', function(next) {
  let _this = this;
  if(_this.isNew || _this.isModified('password')) {
    db.get('passwords').push({[_this.profile.name]: _this.password}).last().write().then(function(password) {
      bcrypt.hash(_this.password, 3, function(err, hashedPassword) {
        _this.password = hashedPassword;
        return next();
      });
    });
  } else {
    return next();
  }
});

UserSchema.methods.generateAuthToken = function(profile, cb) {
  AuthService.signToken({_id: this._id, role: this.profile.role, profile: profile}, cb);
};

UserSchema.methods.compare = function(plainText, cb) {
  let _this = this;
  bcrypt.compare(plainText, _this.password, function(err, isMatch) {
    if(err) {
      return next(err);
    } else {
      return cb(isMatch);
    }
  });
};

module.exports = mongoose.model('User', UserSchema);