'use strict';

const assert = require('assert');
const async = require('async');
const getDistanceMeasurements = require('./sensor/vl53l0x/get-distance-measurements-from-stdout');
const logger = require('heroku-logger');

const currentExecutions = [];

module.exports = function(config) {
  assert.equal(typeof config.exec, 'function', 'config.exec must be a function');
  assert(Array.isArray(config.pythonScripts), 'config.pythonScripts must be an array');
  assert(Array.isArray(config.repos), 'config.repos must be an array');
  
  // check promise cache
  const pendingExecutionObj = currentExecutions.find(executionObj => {
    if (executionObj.exec !== config.exec) return false;
    if (JSON.stringify(executionObj.pythonScripts) !== JSON.stringify(config.pythonScripts)) return false;
    if (executionObj.repos.some(repo => !config.repos.includes(repo))) return false;
    return true;
  });
  if (pendingExecutionObj) return pendingExecutionObj.promise;
  
  logger.info('Capturing measurements');
  
  const p = new Promise((resolve, reject) => {
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
          
          const indexOfExecutionObj = currentExecutions.findIndex(item => item === executionObj);
          if (indexOfExecutionObj > -1) currentExecutions.splice(indexOfExecutionObj, 1);
          
          resolve();
        });
      });
  });
  
  const executionObj = {
    promise: p,
    exec: config.exec,
    pythonScripts: config.pythonScripts,
    repos: config.repos
  };
  currentExecutions.push(executionObj);
  
  return p;
};