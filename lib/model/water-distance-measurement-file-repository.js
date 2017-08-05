'use strict';

const assert = require('assert');
const fs = require('fs');
const ValidationError = require('./../util/ValidationError');

module.exports = function(config) {
  assert.equal(typeof config.filepath, 'string', 'config.filepath must be a string');
  assert.equal(typeof config.validate, 'function', 'config.validate must be a function');
  
  const filepath = config.filepath;
  const validate = config.validate;
  
  const readJSONFile = function(filepath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filepath, function(err, contents) {
        if (err) return reject(err);
        try {
          const json = contents.toString() ? JSON.parse(contents.toString()) : [];
          resolve(json);
        } catch(e) {
          reject(e);
        }
      });
    });
  };
  
  return {
    create: function(measurementObj) {
      if (!validate(measurementObj)) {
        const error = new ValidationError(validate.errors);
        return Promise.reject(error);
      }
      
      return new Promise((resolve, reject) => {
        readJSONFile(filepath)
          .then(json => {
            json.push(measurementObj);
            fs.writeFile(filepath, JSON.stringify(json), function(err) {
              if (err) return reject(err);
              resolve(measurementObj);
            });
          })
          .catch(reject);
      });
    },
    readAll: function() {
      return readJSONFile(filepath);
    }
  };
};