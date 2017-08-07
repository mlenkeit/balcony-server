'use strict';

const MongoClient = require('mongodb').MongoClient;

module.exports = function(config) {
  let whenConnected;
  
  return function() {
    return new Promise(function(resolve, reject) {
      if (!whenConnected) {
        whenConnected = MongoClient.connect(config.url);
        whenConnected.then(db => {
          db.on('close', () => whenConnected = null);
        }).catch(reject);
      }
      return resolve(whenConnected);
    });
  };
};