'use strict';

const assert = require('assert');
const exec = require('./lib/util/exec');
const fs = require('fs');
const logger = require('heroku-logger');
const path = require('path');
const uuid = require('uuid/v4');
const validateMeasurementObject = require('./lib/validation').validateMeasurementObject;
const xsenv = require('@sap/xsenv');

xsenv.loadEnv();

const HTTP_REPO_URI = process.env.HTTP_REPO_URI;
assert(HTTP_REPO_URI, 'missing env var HTTP_REPO_URI');
const MONGODB_URI = process.env.MONGODB_URI;
assert(MONGODB_URI, 'missing env var MONGODB_URI');
const pumpPlugDeviceId = process.env.PLUG_DEVICE_ID_PUMP;
assert(pumpPlugDeviceId, 'missing env var PLUG_DEVICE_ID_PUMP');
const tomatoesPlugDeviceId = process.env.PLUG_DEVICE_ID_TOMATOES;
assert(tomatoesPlugDeviceId, 'missing env var PLUG_DEVICE_ID_TOMATOES');
const balconyPlugDeviceId = process.env.PLUG_DEVICE_ID_BALCONY;
assert(balconyPlugDeviceId, 'missing env var PLUG_DEVICE_ID_BALCONY');
const pythonScriptsFilepath = process.env.PYTHON_SCRIPTS_FILEPATH;
assert(pythonScriptsFilepath, 'missing env var PYTHON_SCRIPTS_FILEPATH');

logger.info('Running with plug device ids', {
  PLUG_DEVICE_ID_PUMP: pumpPlugDeviceId,
  PLUG_DEVICE_ID_TOMATOES: tomatoesPlugDeviceId,
  PLUG_DEVICE_ID_BALCONY: balconyPlugDeviceId
});

const API_TOKEN = process.env.API_TOKEN || uuid();
const PORT = process.env.PORT || 3000;

const buildMetadataFilepath = path.resolve(__dirname, './build-metadata.json');
const buildMetadata = fs.existsSync(buildMetadataFilepath) ? require(buildMetadataFilepath) : {};

const Hs100Api = require('hs100-api');
const plugRepo = require('./lib/model/plug-repo')({
  client: new Hs100Api.Client(),
  discoverTimeout: 1000
});

const setPower = require('./lib/action/set-power');
const powerOn = setPower({ plugRepo: plugRepo, value: true });
const powerOff = setPower({ plugRepo: plugRepo, value: false });

const setIrrigationValve = require('./lib/action/set-irrigation-valve');
const startIrrigationValve = setIrrigationValve({
  plugRepo: plugRepo,
  plugOn: powerOn,
  plugOff: powerOff,
  pumpPlugDeviceId: pumpPlugDeviceId,
  value: true,
  valvePlugDeviceIds: [tomatoesPlugDeviceId, balconyPlugDeviceId]
});
const stopIrrigationValve = setIrrigationValve({
  plugRepo: plugRepo,
  plugOn: powerOn,
  plugOff: powerOff,
  pumpPlugDeviceId: pumpPlugDeviceId,
  value: false,
  valvePlugDeviceIds: [tomatoesPlugDeviceId, balconyPlugDeviceId]
});

const mongoConnect = require('./lib/model/mongodb-connector')({
  url: MONGODB_URI
});
const mongoRepo = require('./lib/model/water-distance-measurement-mongo-repository')({
  connect: mongoConnect,
  validate: validateMeasurementObject
});

const httpRepo = require('./lib/model/water-distance-measurement-http-repository')({
  apiToken: API_TOKEN,
  uri: HTTP_REPO_URI,
  validate: validateMeasurementObject
});

const pythonScriptsStr = fs.readFileSync(pythonScriptsFilepath);
const pythonScripts = JSON.parse(pythonScriptsStr);
const captureDistance = require('./lib/capture-distance');

const app = require('./lib/app-pi')({
  apiToken: API_TOKEN,
  buildMetadata: buildMetadata,
  captureDistance: function() {
    captureDistance({
      exec: exec,
      pythonScripts: pythonScripts,
      repos: [
        httpRepo,
        mongoRepo
      ]
    });
  },
  plugRepo: plugRepo,
  powerOn: powerOn,
  powerOff: powerOff,
  startIrrigationValve: startIrrigationValve,
  stopIrrigationValve: stopIrrigationValve
});

app.listen(PORT, function() {
  logger.info(`Server started on port ${PORT}`);
});