'use strict';

const assert = require('assert');
const ValidationError = require('./../util/ValidationError');

const collection = 'water-distance-measurement';

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
    create: function(measurementObj) {
      if (!validate(measurementObj)) {
        const error = new ValidationError(validate.errors);
        return Promise.reject(error);
      }
      
      return connect()
        .then(db => db.collection(collection))
        .then(col => col.insertOne(measurementObj))
        .then(() => measurementObj);
    },
    readAll: function() {
      return connect()
        .then(db => db.collection(collection))
        .then(collection => collection.find().toArray());
    },
    getLatestUpdateTimestamps: function(limit) {
      limit = limit || 2;
      return connect()
        .then(db => db.collection(collection))
        .then(collection => {
          return collection.aggregate([{
            $sort: { timestamp: 1 }
          }, {
            $group: { _id : '$timestamp' }
          }, {
            $limit: limit
          }]);
        })
        .then(cursor => cursor.toArray())
        .then(arr => arr.map(it => it._id));
    },
    getAverage: () => {
      return connect()
        .then(db => db.collection(collection))
        .then(col => col.aggregate([{
          $match: { measurement: { $lte: 2000 } }
        }, {
          $group: { _id : { timestamp: '$timestamp', measurementType: '$measurementType' }, avgAmount: { $avg: '$measurement' } }
        }, {
          $sort: { '_id.timestamp': -1, '_id.measurementType': 1 }
        }, {
          $limit: 50
        }]))
        .then(cursor => cursor.toArray());
    }
  };
};