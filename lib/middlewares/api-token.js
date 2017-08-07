'use strict';

const assert = require('assert');
const express = require('express');
const HttpError = require('./../util/HttpError');

const API_TOKEN_EXPRESSION = /^token (.*)$/;

// expects header
module.exports = function(config) {
  assert.equal(typeof config.apiToken, 'string', 'config.apiToken must be a string');
  
  const router = express.Router();
  
  router.use((req, res, next) => {
    if (req.method === 'GET' && config.secureGet !== true) {
      return next();
    }
    
    const authorization = req.get('Authorization') || '';
    const tokenMatches = API_TOKEN_EXPRESSION.exec(authorization);
    const token = tokenMatches ? tokenMatches[1] : null;
    
    if (token !== config.apiToken) {
      return next(new HttpError(401));
    }
    next();
  });
  
  return router;
};