'use strict';

const assert = require('assert');
const async = require('async');
const getDistanceMeasurements = require('./sensor/vl53l0x/get-distance-measurements-from-stdout');

module.exports = function(config) {
  assert.equal(typeof config.exec, 'function', 'config.exec must be a function');
  assert(Array.isArray(config.pythonScripts), 'config.pythonScripts must be an array');
  assert(Array.isArray(config.repos), 'config.repos must be an array');
  
  return new Promise((resolve, reject) => {
    const timestamp = new Date().getTime();
    
    async.mapSeries(config.pythonScripts,
      function iteratee(item, cb) {
        config.exec(`python ${item.command}`, {
          cwd: item.cwd
        }).then(stdout => {
          cb(null, { name: item.name, stdout: stdout });
        }).catch(cb);
      },
      function cb(err, results) {
        if (err) {
          return reject(err);
        }
        
        const measurementsByName = results
          .map(item => {
            return { name: item.name, measurements: getDistanceMeasurements(item.stdout) };
          });
        
        const measurementObjs = measurementsByName
          .reduce((arr, item) => {
            item.measurements.forEach(measurement => {
              arr.push({
                timestamp: timestamp,
                sensor: 'vl53l0x',
                measurementType: item.name,
                measurement: measurement,
                measurementUnit: 'mm'
              });
            });
            return arr;
          }, []);
          
        async.eachSeries(measurementObjs, (measurementObj, cb) => {
          async.eachSeries(config.repos, (repo, cb) => {
            repo.create(measurementObj)
              .then(() => cb())
              .catch(err => cb(err));
          }, err => cb(err));
        }, err => {
          if (err) return reject(err);
          resolve();
        });
      });
  });
};