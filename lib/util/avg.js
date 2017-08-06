'use strict';

module.exports = function(arr) {
  if (!arr.length) return undefined;
  return arr.reduce((sum, curr) => sum += curr) / arr.length;
};