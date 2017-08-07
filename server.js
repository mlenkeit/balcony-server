'use strict';

const fs = require('fs');
const logger = require('heroku-logger');
const path = require('path');
const uuid = require('uuid/v4');
const xsenv = require('@sap/xsenv');

// Load the environment variables (default-env.json), unless already set.
xsenv.loadEnv();

const API_TOKEN = process.env.api_token || uuid();
const MONGO_DB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3000;
const SERVICES_CONFIG = xsenv.getServices({
  mongodb: process.env.mongodb_service_name
});

const mongodbConnect = require('./lib/model/mongodb-connector')({
  url: MONGO_DB_URI || SERVICES_CONFIG.mongodb.uri
});

const waterDistanceMeasurementRepo = require('./lib/model/water-distance-measurement-mongo-repository')({
  connect: mongodbConnect,
  validate: require('./lib/validation').validateMeasurementObject
});
const linqueRepo = require('./lib/model/linque-repo')({
  connect: mongodbConnect
});

const buildMetadataFilepath = path.resolve(__dirname, './build-metadata.json');
const buildMetadata = fs.existsSync(buildMetadataFilepath) ? require(buildMetadataFilepath) : {};

const app = require('./lib/app')({
  apiToken: API_TOKEN,
  buildMetadata: buildMetadata,
  linqueRepo: linqueRepo,
  waterDistanceMeasurementRepo: waterDistanceMeasurementRepo
});

app.listen(PORT, function() {
  logger.info(`Server started on port ${PORT}`);
});