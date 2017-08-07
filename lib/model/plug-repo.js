'use strict';

const assert = require('assert');

module.exports = function(config) {
  assert.equal(typeof config.client, 'object', 'config.client must be an object');
  assert.equal(typeof config.discoverTimeout, 'number', 'config.discoverTimeout must be an number');
  
  const plugByDeviceId = {};
  const updatePlug = plug => plug.getInfo().then(info => {
    plugByDeviceId[info.sysInfo.deviceId] = {
      info: info,
      plug: plug
    };
  });
  
  const repo = {
    discover: () => {
      config.client.startDiscovery().on('plug-new', plug => {
        updatePlug(plug);
        plug.on('power-on', updatePlug);
        plug.on('power-off', updatePlug);
        plug.on('in-use', updatePlug);
        plug.on('not-in-use', updatePlug);
      });
      config.client.on('plug-online', updatePlug);
      config.client.on('plug-offline', updatePlug);
      return new Promise(resolve => {
        setTimeout(resolve, config.discoverTimeout);
      });
    },
    findAllInfos: () => {
      return repo.discover()
        .then(() => {
          return Object.keys(plugByDeviceId)
            .map(deviceId => plugByDeviceId[deviceId])
            .map(plug => plug.info);
        });
    },
    findAll: () => {
      return repo.discover()
        .then(() => {
          return Object.keys(plugByDeviceId)
            .map(deviceId => plugByDeviceId[deviceId])
            .map(plug => plug.plug);
        });
    },
    findById: (deviceId) => {
      return repo.discover()
        .then(() => plugByDeviceId[deviceId])
        .then(plug => plug ? plug.plug : null);
    }
  };
  
  return repo;
};