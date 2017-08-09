'use strict';

const assert = require('assert');
const express = require('express');

module.exports = function(config) {
  assert.equal(typeof config.repo, 'object', 'config.repo must be an object');
  
  const router = express.Router();
  
  router.get('/', (req, res, next) => {
    config.repo.readAll()
      .then(plugStateInfos => res.status(200).json(plugStateInfos))
      .catch(next);
  });
  
  return router;
};