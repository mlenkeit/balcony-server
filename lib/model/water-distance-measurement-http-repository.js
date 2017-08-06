'use strict';

const assert = require('assert');
const request = require('request');
const ValidationError = require('./../util/ValidationError');

module.exports = function(config) {
  assert.equal(typeof config.uri, 'string', 'config.uri must be a string');
  assert.equal(typeof config.validate, 'function', 'config.validate must be a function');
  
  const uri = config.uri;
  const validate = config.validate;
  
  return {
    create: function(measurementObj) {
      if (!validate(measurementObj)) {
        const error = new ValidationError(validate.errors);
        return Promise.reject(error);
      }

      return new Promise((resolve, reject) => {
        request.post({
          uri: uri,
          json: measurementObj
        }, (err, res, body) => {
          if (err) return reject(err);
          resolve(body);
        });
      });
    },
    readAll: function() {
      return new Promise((resolve, reject) => {
        request.get({
          uri: uri,
          json: true
        }, (err, res, body) => {
          if (err) return reject(err);
          resolve(body);
        });
      });
      // return connect()
      //   .then(db => db.collection(collection))
      //   .then(collection => collection.find().toArray());
    }
  };
  
  
};