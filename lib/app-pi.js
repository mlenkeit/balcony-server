'use strict';

const assert = require('assert');
const express = require('express');
const logger = require('heroku-logger');

module.exports = function(config) {
  assert.equal(typeof config.apiToken, 'string', 'config.apiToken must be a string');
  assert.equal(typeof config.buildMetadata, 'object', 'config.buildMetadata must be an object');
  assert.equal(typeof config.captureDistance, 'function', 'config.captureDistance must be a function');
  assert.equal(typeof config.exec, 'function', 'config.exec must be a function');
  assert.equal(typeof config.plugRepo, 'object', 'config.plugRepo must be an object');
  assert.equal(typeof config.plugStateRepo, 'object', 'config.plugStateRepo must be an object');
  assert.equal(typeof config.powerOn, 'function', 'config.powerOn must be a function');
  assert.equal(typeof config.powerOff, 'function', 'config.powerOff must be a function');
  assert.equal(typeof config.startIrrigationValve, 'function', 'config.startIrrigationValve must be a function');
  assert.equal(typeof config.stopIrrigationValve, 'function', 'config.stopIrrigationValve must be a function');
  
  const app = express();
  
  logger.info(`Accepting API token: ${config.apiToken}`);
  
  app.use(require('./middlewares/logging')());
  
  app.use('/health', require('./controllers/health')({
    buildMetadata: config.buildMetadata
  }));
  app.use('/irrigation-action', require('./controllers/generic-action')({
    actions: {
      'start-irrigation-valve': config.startIrrigationValve,
      'stop-irrigation-valve': config.stopIrrigationValve
    },
    apiToken: config.apiToken
  }));
  app.use('/logs', require('./controllers/forever-logs')({
    apiToken: config.apiToken,
    exec: config.exec
  }));
  app.use('/plugs', require('./controllers/plugs')({
    apiToken: config.apiToken,
    repo: config.plugRepo
  }));
  app.use('/plugs/action', require('./controllers/generic-action')({
    actions: {
      'power-on': config.powerOn,
      'power-off': config.powerOff
    },
    apiToken: config.apiToken
  }));
  app.use('/plug-states', require('./controllers/plug-states')({
    apiToken: config.apiToken,
    repo: config.plugStateRepo
  }));
  app.use('/sensor-action', require('./controllers/generic-action')({
    actions: {
      'capture-distance': config.captureDistance
    },
    apiToken: config.apiToken
  }));
  
  app.use(require('./middlewares/error-logging')());
  app.use(require('./middlewares/error-json-response')());
  
  return app;
};