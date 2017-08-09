'use strict';

const assert = require('assert');
const logger = require('heroku-logger');

module.exports = function(config) {
  assert.equal(typeof config.plugRepo, 'object', 'config.plugRepo must be an object');
  assert.equal(typeof config.plugStateRepo, 'object', 'config.plugStateRepo must be an object');
  
  
  logger.info('Synchronizing power state');
  return config.plugStateRepo.readAll()
    .then(plugInfos => {
      return Promise.all(
        plugInfos.map(plugInfo => {
          logger.info(`Device ${plugInfo.deviceId} should have relayState ${plugInfo.relayState}`);
          return config.plugRepo.findById(plugInfo.deviceId)
            .then(plug => {
              return plug.setPowerState(plugInfo.relayState === 1 ? true : false);
            }).catch(err => {
              logger.warn('Failed to set power state', {
                deviceId: plugInfo.deviceId,
                relayState: plugInfo.relayState,
                error: err
              });
            });
        })
      );
    });
};