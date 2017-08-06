'use strict';

const assert = require('assert');
const bodyParser = require('body-parser');
const express = require('express');
const HttpError = require('./../util/HttpError');

const API_TOKEN_EXPRESSION = /^token (.*)$/;

module.exports = function(config) {
  assert.equal(typeof config.apiToken, 'string', 'config.apiToken must be a string');
  assert.equal(typeof config.waterDistanceMeasurementRepo, 'object', 'config.waterDistanceMeasurementRepo must be an object');
  const router = express.Router();
  
  const apiToken = config.apiToken;
  const waterDistanceMeasurementRepo = config.waterDistanceMeasurementRepo;

  router.get('/', function(req, res, next) {
    waterDistanceMeasurementRepo.readAll()
      .then(list => res.status(200).json(list))
      .catch(next);
  });
  
  router.use(function(req, res, next) {
    if (req.method === 'GET') {
      return next();
    }
    
    const authorization = req.get('Authorization') || '';
    const tokenMatches = API_TOKEN_EXPRESSION.exec(authorization);
    const token = tokenMatches ? tokenMatches[1] : null;
    
    if (token !== apiToken) {
      return next(new HttpError(401));
    }
    next();
  });
  
  router.use(bodyParser.json());

  router.post('/', function(req, res, next) {
    const measurementObj = req.body;
    waterDistanceMeasurementRepo.create(measurementObj)
      .then(measurementObj => res.status(201).json(measurementObj))
      .catch(next);
  });
  
  return router;
};