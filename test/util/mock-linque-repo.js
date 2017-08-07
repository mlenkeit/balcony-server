'use strict';

const sinon = require('sinon');

module.exports = function() {
  
  return {
    findOne: sinon.stub(),
    update: sinon.stub()
  };
};