'use strict';

module.exports = function(stdout) {
  const pattern = /\d+ mm, \d+ cm/ig;
  const matches = stdout.match(pattern);
  
  if (!matches) {
    return [];
  }
  
  const measurements = matches.map(match => {
    const matches = /(\d+) mm/.exec(match);
    const measurementStr = matches[1];
    return parseInt(measurementStr, 10);
  });
  
  return measurements;
};