'use strict';

let counter = 1;
module.exports = function() {
  return {
    'timestamp': new Date().getTime(),
    'sensor': 'abc',
    'measurementType': 'short',
    'measurement': 12 + counter++,
    'measurementUnit': 'mm'
  }; 
};