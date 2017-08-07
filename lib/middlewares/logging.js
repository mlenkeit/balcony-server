'use strict';

const express = require('express');
const logger = require('heroku-logger');
const uuid = require('uuid/v4');

module.exports = function() {
  const router = express.Router();
  
  router.use((req, res, next) => {
    const corId = req.header('X-CorrelationID') || uuid();
    req.log = function() {
      logger.log.apply(logger, arguments);
    };
    req.logMessage = function() {
      logger.log.apply(logger, arguments);
    };
    
    req.log('info', 'Incoming request', {
      correlation_id: corId
    });
    
    next();
  });
  
  return router;
};