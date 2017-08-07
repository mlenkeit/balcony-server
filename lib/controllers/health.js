'use strict';

const assert = require('assert');
const express = require('express');
const pkg = require('./../../package.json');

module.exports = function(config) {
  assert.equal(typeof config.buildMetadata, 'object', 'config.buildMetadata must be an object');
  
  const router = express.Router();
  
  router.get('/status', (req, res) => {
    res.status(200).json({ 
      status: 'ok',
      version: pkg.version,
      'build-metadata': config.buildMetadata
    });
  });
  
  return router;
};