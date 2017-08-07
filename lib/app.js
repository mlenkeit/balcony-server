'use strict';

const express = require('express');
const logger = require('heroku-logger');

module.exports = function(config) {
  const app = express();
  
  const apiToken = config.apiToken;
  const buildMetadata = config.buildMetadata;
  const waterDistanceMeasurementRepo = config.waterDistanceMeasurementRepo;
  
  logger.info(`Accepting API token: ${config.apiToken}`);
  
  app.use(require('./middlewares/logging')());
  
  app.use('/health', require('./controllers/health')({
    buildMetadata: buildMetadata,
    waterDistanceMeasurementRepo: waterDistanceMeasurementRepo
  }));
  app.use('/water-distance-measurement', require('./controllers/water-distance-measurement')({
    apiToken: apiToken,
    waterDistanceMeasurementRepo: waterDistanceMeasurementRepo
  }));
  
  app.use(require('./middlewares/error-logging')());
  app.use(require('./middlewares/error-json-response')());
  
  return app;
};