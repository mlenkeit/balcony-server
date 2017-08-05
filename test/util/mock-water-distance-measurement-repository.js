'use strict';

const sinon = require('sinon');

module.exports = function() {
  
  return {
    create: sinon.stub(),
    readAll: sinon.stub()
  };
};