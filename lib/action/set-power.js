'use strict';

const assert = require('assert');
const logger = require('heroku-logger');

module.exports = function(config) {
  assert.equal(typeof config.plugRepo, 'object', 'config.plugRepo must be an object');
  assert.equal(typeof config.plugStateRepo, 'object', 'config.plugStateRepo must be an object');
  assert.equal(typeof config.value, 'boolean', 'config.value must be a boolean');
  
  return function(deviceId) {
    logger.info(`Setting power state for ${deviceId}`);
    config.plugRepo.findById(deviceId)
      .then(plug => {
        if (!plug) {
          throw new Error(`Cannot find ${deviceId}`);
        }
        return plug.setPowerState(config.value);
      })
      .catch(err => {
        logger.warn(`Cannot set power state because device ${deviceId} wasn't found.`, {
          error: err
        });
      });
    return config.plugStateRepo.upsert({
      deviceId: deviceId,
      relayState: config.value ? 1 : 0
    });
  };
};