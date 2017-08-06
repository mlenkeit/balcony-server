'use strict';

const assert = require('assert');
const async = require('async');
const avg = require('./util/avg');
const getDistanceMeasurements = require('./sensor/vl53l0x/get-distance-measurements-from-stdout');
const path = require('path');

module.exports = function(config) {
  assert(config.exec, 'missing mandatory exec config');
  assert(config.pythonScripts, 'missing mandatory pythonScripts config');
  
  return new Promise((resolve, reject) => {
    async.mapSeries(config.pythonScripts,
      function iteratee(item, cb) {
        config.exec(`python ${item.command}`, {
          cwd: item.cwd
        }).then(stdout => cb(null, { name: item.name, stdout: stdout }));
      },
      function cb(err, results) {
        if (err) {
          return reject(err);
        }
        
        const measurements = results.map(item => {
          return { name: item.name, measurements: getDistanceMeasurements(item.stdout) };
        });
        
        
        
        resolve();
      });
  });
  
  
  
  
  // const pythonLongRangeScriptPathObj = path.parse(config.pythonLongRangeScript);
  // const execLongRange = exec(`python ${pythonLongRangeScriptPathObj.base}`, { cwd: pythonLongRangeScriptPathObj.dir });
  // const pythonShortRangeScriptPathObj = path.parse(config.pythonShortRangeScript);
  // const execShortRange = exec(`python ${pythonShortRangeScriptPathObj.base}`, { cwd: pythonShortRangeScriptPathObj.dir });
  // 
  // // distanceMeasurementFromPython(execLongRange)
  // //   .then(longRangeMeasurements => avg(longRangeMeasurements))
  // //   .then(avg => console.log(`long avg: ${avg}`))
  // //   .catch(console.log);
  // distanceMeasurementFromPython(execShortRange)
  //   .then(shortRangeMeasurements => avg(shortRangeMeasurements))
  //   .then(avg => console.log(`short avg: ${avg}`))
  //   .catch(console.log);
};