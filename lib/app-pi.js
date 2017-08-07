'use strict';

const assert = require('assert');
const cfLogging = require('cf-nodejs-logging-support');
const express = require('express');

module.exports = function(config) {
  assert.equal(typeof config.apiToken, 'string', 'config.apiToken must be a string');
  assert.equal(typeof config.buildMetadata, 'object', 'config.buildMetadata must be an object');
  assert.equal(typeof config.discoverPlugs, 'function', 'config.discoverPlugs must be a function');
  assert.equal(typeof config.captureDistance, 'function', 'config.captureDistance must be a function');
  assert.equal(typeof config.hs100Client, 'object', 'config.hs100Client must be an object');
  assert.equal(typeof config.plugRepo, 'object', 'config.plugRepo must be an object');
  assert.equal(typeof config.powerOn, 'function', 'config.powerOn must be a function');
  assert.equal(typeof config.powerOff, 'function', 'config.powerOff must be a function');
  assert.equal(typeof config.startIrrigationValve, 'function', 'config.startIrrigationValve must be a function');
  assert.equal(typeof config.stopIrrigationValve, 'function', 'config.stopIrrigationValve must be a function');
  
  const app = express();
  
  cfLogging.logMessage('info', 'Accepting API token: %s', config.apiToken);
  
  app.use(cfLogging.logNetwork);
  
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
  app.use('/plugs', require('./controllers/plugs')({
    apiToken: config.apiToken,
    repo: config.plugRepo
  }));
  app.use('/plugs/action', require('./controllers/generic-action')({
    actions: {
      'discover': config.discoverPlugs,
      'power-on': config.powerOn,
      'power-off': config.powerOff
    },
    apiToken: config.apiToken
  }));
  app.use('/sensor-action', require('./controllers/generic-action')({
    actions: {
      'capture-distance': config.captureDistance
    },
    apiToken: config.apiToken
  }));
  
  app.use(require('./middlewares/error-json-response')());
  
  return app;
};