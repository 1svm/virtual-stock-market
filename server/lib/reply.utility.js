'use strict';

module.exports = function(code, message, others) {
  let obj = Object.assign({error: code >= 400, message: message}, others || {});
  return function(res) {
    res.status(code).send(obj);
  };
};