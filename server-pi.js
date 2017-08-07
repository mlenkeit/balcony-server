'use strict';

const assert = require('assert');
const cfLogging = require('cf-nodejs-logging-support');
const fs = require('fs');
const path = require('path');
const uuid = require('uuid/v4');
const xsenv = require('@sap/xsenv');

xsenv.loadEnv();

const pumpPlugDeviceId = process.env.PLUG_DEVICE_ID_PUMP;
assert(pumpPlugDeviceId, 'missing env var PLUG_DEVICE_ID_PUMP');
const tomatoesPlugDeviceId = process.env.PLUG_DEVICE_ID_TOMATOES;
assert(tomatoesPlugDeviceId, 'missing env var PLUG_DEVICE_ID_TOMATOES');
const balconyPlugDeviceId = process.env.PLUG_DEVICE_ID_BALCONY;
assert(balconyPlugDeviceId, 'missing env var PLUG_DEVICE_ID_BALCONY');

const API_TOKEN = process.env.api_token || uuid();
const PORT = process.env.PORT || 3000;
cfLogging.setLoggingLevel(process.env.log_level || 'error');

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

const app = require('./lib/app-pi')({
  apiToken: API_TOKEN,
  buildMetadata: buildMetadata,
  captureDistance: () => Promise.resolve(),
  plugRepo: plugRepo,
  powerOn: powerOn,
  powerOff: powerOff,
  startIrrigationValve: startIrrigationValve,
  stopIrrigationValve: stopIrrigationValve
});

app.listen(PORT, function() {
  console.log(`Server started on port ${PORT}`);
});