'use strict';

const validator = require('is-my-json-valid');

module.exports = {
  validateActionObject: validator(require('./schema/ActionObject')),
  validateMeasurementObject: validator(require('./schema/MeasurementObject')),
  validatePublicPlugSysInfoObject: validator(require('./schema/PublicPlugSysInfoObject'))
};