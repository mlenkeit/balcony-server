'use strict';

const assert = require('assert');
const ValidationError = require('./../util/ValidationError');

const collection = 'plug-state';

module.exports = function(config) {
  assert.equal(typeof config.connect, 'function', 'config.connect must be a function');
  assert.equal(typeof config.validate, 'function', 'config.validate must be a function');
  
  const connect = config.connect;
  const validate = config.validate;
  
  return {
    count: function() {
      return connect()
        .then(db => db.collection(collection))
        .then(col => col.count());
    },
    upsert: function(item) {
      if (!validate(item)) {
        const error = new ValidationError(validate.errors);
        return Promise.reject(error);
      }
      return connect()
        .then(db => db.collection(collection))
        .then(col => col.update({ deviceId: item.deviceId}, item, { upsert: true }))
        .then(() => item);
    },
    readAll: function() {
      return connect()
        .then(db => db.collection(collection))
        .then(collection => collection.find().toArray());
    }
  };
};