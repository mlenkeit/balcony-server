'use strict';

const assert = require('assert');

module.exports = function(config) {
  assert.equal(typeof config.plugOn, 'function', 'config.plugOn must be a function');
  assert.equal(typeof config.plugOff, 'function', 'config.plugOff must be a function');
  assert.equal(typeof config.plugRepo, 'object', 'config.plugRepo must be an object');
  assert.equal(typeof config.pumpPlugDeviceId, 'string', 'config.pumpPlugDeviceId must be a string');
  assert.equal(typeof config.value, 'boolean', 'config.value must be a boolean');
  assert.equal(Array.isArray(config.valvePlugDeviceIds), true, 'config.valvePlugDeviceIds must be an array');
  
  if (config.value) {
    return function(deviceId) {
      return Promise.all([
        config.plugOn(deviceId),
        config.plugOn(config.pumpPlugDeviceId)
      ]).catch(err => {
        const rethrow = () => Promise.reject(err);
        return Promise.all([
          config.plugOff(deviceId),
          config.plugOff(config.pumpPlugDeviceId)
        ]).then(rethrow, rethrow);
      });
    };
  } else {
    return function(deviceId) {
      const apValveInfos = config.valvePlugDeviceIds
        .map(id => config.plugRepo.findById(id))
        .map(pPlug => pPlug.then(plug => plug.getInfo()));
      return Promise.all(apValveInfos)
        .then(values => {
          const valvePlugInfos = values;
          const otherActiveValve = valvePlugInfos
            .some(info => info.sysInfo.deviceId !== deviceId && info.sysInfo.relay_state === 1);
          const ap = [config.plugOff(deviceId)];
          if (!otherActiveValve) ap.push(config.plugOff(config.pumpPlugDeviceId));
          return Promise.all(ap);
        });
    };
  }
};