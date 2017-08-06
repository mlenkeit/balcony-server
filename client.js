'use strict';

const captureDistance = require('./lib/capture-distance');
const fs = require('fs');
const exec = require('./lib/util/exec');
const validateMeasurementObject = require('./lib/validation').validateMeasurementObject;

const pythonScriptsFilepath = process.env.python_scripts_filepath;
const pythonScriptsStr = fs.readFileSync(pythonScriptsFilepath);
const pythonScripts = JSON.parse(pythonScriptsStr);
console.log('python_scripts', pythonScripts);

const measurementsFilepath = process.env.measurements_filepath;
console.log('measurements_filepath', measurementsFilepath);
const fileRepo = require('./lib/model/water-distance-measurement-file-repository')({
  filepath: measurementsFilepath,
  validate: validateMeasurementObject
});

const httpRepoUri = process.env.http_repo_uri;
const httpRepo = require('./lib/model/water-distance-measurement-http-repository')({
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
  console.log('success');
  mongoConnect().then(db => db.close());
}).catch(err => {
  console.log('error', err);
});