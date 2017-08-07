'use strict';

const sinon = require('sinon');

module.exports = function() {
  
  return {
    findAll: sinon.stub(),
    findAllInfos: sinon.stub(),
    findById: sinon.stub()
  };
};