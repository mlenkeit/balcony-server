'use strict';

const captureDistance = require('./lib/capture-distance');
const fs = require('fs');
const exec = require('./lib/util/exec');
const logger = require('heroku-logger');
const validateMeasurementObject = require('./lib/validation').validateMeasurementObject;

const pythonScriptsFilepath = process.env.python_scripts_filepath;
const pythonScriptsStr = fs.readFileSync(pythonScriptsFilepath);
const pythonScripts = JSON.parse(pythonScriptsStr);
logger.info('python_scripts', pythonScripts);

const measurementsFilepath = process.env.measurements_filepath;
logger.info('measurements_filepath', measurementsFilepath);
const fileRepo = require('./lib/model/water-distance-measurement-file-repository')({
  filepath: measurementsFilepath,
  validate: validateMeasurementObject
});

const httpRepoUri = process.env.http_repo_uri;
const httpRepo = require('./lib/model/water-distance-measurement-http-repository')({
  apiToken: process.env.api_token,
  uri: httpRepoUri,
  validate: validateMeasurementObject
});

const mongoConnect = require('./lib/model/mongodb-connector')({
  url: process.env.MONGODB_URI
});
const mongoRepo = require('./lib/model/water-distance-measurement-mongo-repository')({
  connect: mongoConnect,
  validate: validateMeasurementObject
});

captureDistance({
  exec: exec,
  pythonScripts: pythonScripts,
  repos: [
    fileRepo,
    httpRepo,
    mongoRepo
  ]
}).then(() => {
  logger.info('success');
  mongoConnect().then(db => db.close());
}).catch(err => {
  logger.info('error', err);
});