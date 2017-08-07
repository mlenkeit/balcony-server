'use strict';

const apiToken = require('./../middlewares/api-token');
const assert = require('assert');
const bodyParser = require('body-parser');
const express = require('express');
const HttpError = require('./../util/HttpError');
const validateActionObject = require('./../validation').validateActionObject;

module.exports = function(config) {
  assert.equal(typeof config.actions, 'object', 'config.actions must be a object');
  assert.equal(typeof config.apiToken, 'string', 'config.apiToken must be a string');
  
  const router = express.Router();
  
  router.use(apiToken({
    apiToken: config.apiToken
  }));
  
  router.post('/', bodyParser.json(), (req, res, next) => {
    const action = req.body;
    if (!validateActionObject(action)) {
      return next(new HttpError(400));
    }
    
    const actionName = action.action;
    const fn = config.actions[actionName];
    if (typeof fn === 'function') {
      const parameters = action.parameters || [];
      fn.apply(null, parameters)
        .then(() => res.status(201).json({ ack: true }))
        .catch(next);
    } else {
      return next(new HttpError(400));
    }
  });
  
  return router;
};