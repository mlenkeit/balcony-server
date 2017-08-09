'use strict';

const validator = require('is-my-json-valid');

module.exports = {
  validateActionObject: validator(require('./schema/ActionObject')),
  validateMeasurementObject: validator(require('./schema/MeasurementObject')),
  validatePlugStateObject: validator(require('./schema/PlugStateObj')),
  validatePublicPlugSysInfoObject: validator(require('./schema/PublicPlugSysInfoObject'))
};