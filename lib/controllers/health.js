'use strict';

const assert = require('assert');
const express = require('express');
const pkg = require('./../../package.json');

module.exports = function(config) {
  assert.equal(typeof config.buildMetadata, 'object', 'config.buildMetadata must be an object');
  assert.equal(typeof config.waterDistanceMeasurementRepo, 'object', 'config.waterDistanceMeasurementRepo must be an object');

  const router = express.Router();
  
  const waterDistanceMeasurementRepo = config.waterDistanceMeasurementRepo;
  
  router.get('/status', (req, res, next) => {
    waterDistanceMeasurementRepo.getLatestUpdateTimestamps()
      .then(latestUpdates => latestUpdates.map(ts => new Date(ts)))
      .then(dates => dates.map(date => date.toString()))
      .then(dateStrings => {
        res.status(200).json({ 
          status: 'ok',
          version: pkg.version,
          'build-metadata': config.buildMetadata,
          'latest-updates': dateStrings
        });
      })
      .catch(next);
  });
  
  return router;
};