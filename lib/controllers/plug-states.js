'use strict';

const assert = require('assert');
const bodyParser = require('body-parser');
const express = require('express');

module.exports = function(config) {
  assert.equal(typeof config.repo, 'object', 'config.repo must be an object');
  
  const router = express.Router();
  
  router.get('/', (req, res, next) => {
    config.repo.readAll()
      .then(plugStateInfos => res.status(200).json(plugStateInfos))
      .catch(next);
  });
  
  router.put('/:deviceId', bodyParser.json(), (req, res, next) => {
    config.repo.upsert(req.body)
      .then(plugStateInfo => res.status(200).json(plugStateInfo))
      .catch(next);
  });
  
  
  return router;
};