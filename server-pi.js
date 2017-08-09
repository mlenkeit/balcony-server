'use strict';

const assert = require('assert');
const CronJob = require('cron').CronJob;
const exec = require('./lib/util/exec');
const fs = require('fs');
const logger = require('heroku-logger');
const path = require('path');
const uuid = require('uuid/v4');
const syncPowerState = require('./lib/action/sync-power-state');
const validateMeasurementObject = require('./lib/validation').validateMeasurementObject;
const validatePlugStateObject = require('./lib/validation').validatePlugStateObject;
const xsenv = require('@sap/xsenv');

xsenv.loadEnv();

const HTTP_REPO_URI = process.env.HTTP_REPO_URI;
assert(HTTP_REPO_URI, 'missing env var HTTP_REPO_URI');
const MONGODB_URI = process.env.MONGODB_URI;
assert(MONGODB_URI, 'missing env var MONGODB_URI');
const PLUG_DEVICE_ID_PUMP = process.env.PLUG_DEVICE_ID_PUMP;
assert(PLUG_DEVICE_ID_PUMP, 'missing env var PLUG_DEVICE_ID_PUMP');
const PLUG_DEVICE_ID_TOMATOES = process.env.PLUG_DEVICE_ID_TOMATOES;
assert(PLUG_DEVICE_ID_TOMATOES, 'missing env var PLUG_DEVICE_ID_TOMATOES');
const PLUG_DEVICE_ID_BALCONY = process.env.PLUG_DEVICE_ID_BALCONY;
assert(PLUG_DEVICE_ID_BALCONY, 'missing env var PLUG_DEVICE_ID_BALCONY');
const PYTHON_SCRIPTS_FILEPATH = process.env.PYTHON_SCRIPTS_FILEPATH;
assert(PYTHON_SCRIPTS_FILEPATH, 'missing env var PYTHON_SCRIPTS_FILEPATH');

logger.info('Running with plug device ids', {
  PLUG_DEVICE_ID_PUMP: PLUG_DEVICE_ID_PUMP,
  PLUG_DEVICE_ID_TOMATOES: PLUG_DEVICE_ID_TOMATOES,
  PLUG_DEVICE_ID_BALCONY: PLUG_DEVICE_ID_BALCONY
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

const mongoConnect = require('./lib/model/mongodb-connector')({
  url: MONGODB_URI
});
const mongoRepo = require('./lib/model/water-distance-measurement-mongo-repository')({
  connect: mongoConnect,
  validate: validateMeasurementObject
});
const plugStateRepo = require('./lib/model/plug-state-mongo-repo')({
  connect: mongoConnect,
  validate: validatePlugStateObject
});

const httpRepo = require('./lib/model/water-distance-measurement-http-repository')({
  apiToken: API_TOKEN,
  uri: HTTP_REPO_URI,
  validate: validateMeasurementObject
});

const setPower = require('./lib/action/set-power');
const powerOn = setPower({ plugRepo: plugRepo, plugStateRepo: plugStateRepo, value: true });
const powerOff = setPower({ plugRepo: plugRepo, plugStateRepo: plugStateRepo, value: false });

const setIrrigationValve = require('./lib/action/set-irrigation-valve');
const startIrrigationValve = setIrrigationValve({
  plugRepo: plugRepo,
  plugOn: powerOn,
  plugOff: powerOff,
  pumpPlugDeviceId: PLUG_DEVICE_ID_PUMP,
  value: true,
  valvePlugDeviceIds: [PLUG_DEVICE_ID_TOMATOES, PLUG_DEVICE_ID_BALCONY]
});
const stopIrrigationValve = setIrrigationValve({
  plugRepo: plugRepo,
  plugOn: powerOn,
  plugOff: powerOff,
  pumpPlugDeviceId: PLUG_DEVICE_ID_PUMP,
  value: false,
  valvePlugDeviceIds: [PLUG_DEVICE_ID_TOMATOES, PLUG_DEVICE_ID_BALCONY]
});

const pythonScriptsStr = fs.readFileSync(PYTHON_SCRIPTS_FILEPATH);
const pythonScripts = JSON.parse(pythonScriptsStr);
const captureDistance = require('./lib/capture-distance');

const app = require('./lib/app-pi')({
  apiToken: API_TOKEN,
  buildMetadata: buildMetadata,
  captureDistance: function() {
    return captureDistance({
      exec: exec,
      pythonScripts: pythonScripts,
      repos: [
        httpRepo,
        mongoRepo
      ]
    });
  },
  plugRepo: plugRepo,
  plugStateRepo: plugStateRepo,
  powerOn: powerOn,
  powerOff: powerOff,
  startIrrigationValve: startIrrigationValve,
  stopIrrigationValve: stopIrrigationValve
});


new CronJob({
  cronTime: '* * * * *',
  onTick: function() {
    syncPowerState({
      plugRepo: plugRepo,
      plugStateRepo: plugStateRepo
    }).catch(err => {
      logger.warn('Failed to sync power state', {
        error: err
      });
    });
  },
  start: true,
  timeZone: 'Europe/Berlin'
});

new CronJob({
  cronTime: '0 12 * * *',
  onTick: function() {
    startIrrigationValve(PLUG_DEVICE_ID_TOMATOES)
      .then(() => logger.info('Open tomatoe valve'))
      .catch(err => logger.error('Failed opening tomatoe valve', { error: err }));
    // startIrrigationValve(PLUG_DEVICE_ID_BALCONY)
    //   .then(() => logger.info('Open balcony valve'))
    //   .catch(err => logger.error('Failed opening balcony valve', { error: err }));
  },
  start: true,
  timeZone: 'Europe/Berlin'
});
new CronJob({
  cronTime: '3 12 * * *',
  onTick: function() {
    // stopIrrigationValve(PLUG_DEVICE_ID_BALCONY)
    //   .then(() => logger.info('Close balcony valve'))
    //   .catch(err => logger.error('Failed closing balcony valve', { error: err }));
  },
  start: true,
  timeZone: 'Europe/Berlin'
});
new CronJob({
  cronTime: '5 12 * * *',
  onTick: function() {
    stopIrrigationValve(PLUG_DEVICE_ID_TOMATOES)
      .then(() => logger.info('Close tomatoe valve'))
      .catch(err => logger.error('Failed closing tomatoe valve', { error: err }));
  },
  start: true,
  timeZone: 'Europe/Berlin'
});

new CronJob({
  cronTime: '0 21 * * *',
  onTick: function() {
    startIrrigationValve(PLUG_DEVICE_ID_TOMATOES)
      .then(() => logger.info('Open tomatoe valve'))
      .catch(err => logger.error('Failed opening tomatoe valve', { error: err }));
    // startIrrigationValve(PLUG_DEVICE_ID_BALCONY)
    //   .then(() => logger.info('Open balcony valve'))
    //   .catch(err => logger.error('Failed opening balcony valve', { error: err }));
  },
  start: true,
  timeZone: 'Europe/Berlin'
});
new CronJob({
  cronTime: '3 21 * * *',
  onTick: function() {
    // stopIrrigationValve(PLUG_DEVICE_ID_BALCONY)
    //   .then(() => logger.info('Close balcony valve'))
    //   .catch(err => logger.error('Failed closing balcony valve', { error: err }));
  },
  start: true,
  timeZone: 'Europe/Berlin'
});
new CronJob({
  cronTime: '5 21 * * *',
  onTick: function() {
    stopIrrigationValve(PLUG_DEVICE_ID_TOMATOES)
      .then(() => logger.info('Close tomatoe valve'))
      .catch(err => logger.error('Failed closing tomatoe valve', { error: err }));
  },
  start: true,
  timeZone: 'Europe/Berlin'
});

app.listen(PORT, function() {
  logger.info(`Server started on port ${PORT}`);
});