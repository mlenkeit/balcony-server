'use strict';

const assert = require('assert');

const collection = 'linque-info';

module.exports = function(config) {
  assert.equal(typeof config.connect, 'function', 'config.connect must be a function');

  return {
    findOne: () => {
      return config.connect()
        .then(db => db.collection(collection))
        .then(col => col.find().toArray())
        .then(arr => arr[0] || { url: '' });
    },
    update: (linkInfo) => {
      linkInfo.last_update = new Date();
      const pCol = config.connect()
        .then(db => db.collection(collection));
      return pCol
        .then(col => col.deleteMany())
        .then(() => pCol)
        .then(col => col.insertOne(linkInfo));
    }
  };
};