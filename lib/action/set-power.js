'use strict';

const assert = require('assert');

module.exports = function(config) {
  assert.equal(typeof config.plugRepo, 'object', 'config.plugRepo must be an object');
  assert.equal(typeof config.value, 'boolean', 'config.value must be a boolean');
  
  return function(deviceId) {
    return config.plugRepo.findById(deviceId)
      .then(plug => {
        if (!plug) {
          throw new Error(`Cannot find ${deviceId}`);
        }
        plug.setPowerState(config.value);
      });
  };
};