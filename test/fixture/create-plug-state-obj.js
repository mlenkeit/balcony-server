'use strict';

module.exports = function(options) {
  options = options || {};
  options.deviceId = options.deviceId || '2345678098765345678909876545678909876567';
  options.relayState = options.relayState || 0;
  
  return {
    'deviceId': options.deviceId,
    'relayState': options.relayState
  }; 
};