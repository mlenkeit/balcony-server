'use strict';

const assert = require('assert');
const apiToken = require('./../middlewares/api-token');
const bodyParser = require('body-parser');
const express = require('express');

module.exports = function(config) {
  assert.equal(typeof config.apiToken, 'string', 'config.apiToken must be a string');
  assert.equal(typeof config.waterDistanceMeasurementRepo, 'object', 'config.waterDistanceMeasurementRepo must be an object');
  const router = express.Router();
  
  const waterDistanceMeasurementRepo = config.waterDistanceMeasurementRepo;

  router.get('/', function(req, res, next) {
    waterDistanceMeasurementRepo.readAll()
      .then(list => res.status(200).json(list))
      .catch(next);
  });
  
  router.get('/stats', (req, res, next) => {
    const pDateStrings = waterDistanceMeasurementRepo.getLatestUpdateTimestamps()
      .then(latestUpdates => latestUpdates.map(ts => new Date(ts)));
    const pTotalCount = waterDistanceMeasurementRepo.count();
    const pAverages = waterDistanceMeasurementRepo.getAverage();
    Promise.all([
      pDateStrings,
      pTotalCount,
      pAverages
    ]).then(values => {
      res.status(200).json({
        latestUpdates: values[0],
        totalNumberOfRecords: values[1],
        recentAverage: values[2].reduce((arr, item) => {
          const timestamp = item._id.timestamp;
          const measurementType = item._id.measurementType;
          if (!arr[timestamp]) {
            arr[timestamp] = { date: new Date(item.timestamp) };
            arr.push(arr[timestamp]);
          }
          arr[timestamp][measurementType] = item.avgAmount;
          return arr;
        }, new Array())
      });
    }).catch(next);
  });
  
  router.use(apiToken({
    apiToken: config.apiToken
  }));
  
  router.use(bodyParser.json());

  router.post('/', function(req, res, next) {
    const measurementObj = req.body;
    waterDistanceMeasurementRepo.create(measurementObj)
      .then(measurementObj => res.status(201).json(measurementObj))
      .catch(next);
  });
  
  return router;
};