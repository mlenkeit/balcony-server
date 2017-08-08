'use strict';

const sinon = require('sinon');

module.exports = function() {
  
  return {
    count: sinon.stub(),
    create: sinon.stub(),
    readAll: sinon.stub(),
    getLatestUpdateTimestamps: sinon.stub(),
    getAverage: sinon.stub()
  };
};