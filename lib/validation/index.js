'use strict';

const validator = require('is-my-json-valid');

module.exports = {
  validateMeasurementObject: validator(require('./schema/MeasurementObject'))
};