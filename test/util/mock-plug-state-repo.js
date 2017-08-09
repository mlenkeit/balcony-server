'use strict';

const sinon = require('sinon');

module.exports = function() {
  
  return {
    count: sinon.stub(),
    upsert: sinon.stub(),
    readAll: sinon.stub()
  };
};