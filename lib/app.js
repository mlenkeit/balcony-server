'use strict';

const cfLogging = require('cf-nodejs-logging-support');
const express = require('express');

module.exports = function(config) {
  const app = express();
  
  const apiToken = config.apiToken;
  const waterDistanceMeasurementRepo = config.waterDistanceMeasurementRepo;
  
  cfLogging.logMessage('info', 'Accepting API token: %s', apiToken);
  
  app.use(cfLogging.logNetwork);
  
  app.use('/water-distance-measurement', require('./controllers/water-distance-measurement')({
    apiToken: apiToken,
    waterDistanceMeasurementRepo: waterDistanceMeasurementRepo
  }));
  
  app.use(require('./middlewares/error-json-response')());
  
  return app;
};