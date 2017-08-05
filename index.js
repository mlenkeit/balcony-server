'use strict';

const cfLogging = require('cf-nodejs-logging-support');
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
cfLogging.setLoggingLevel(process.env.log_level || 'error');

const mongodbConnect = require('./lib/model/mongodb-connector')({
  url: MONGO_DB_URI || SERVICES_CONFIG.mongodb.uri
});

const waterDistanceMeasurementRepo = require('./lib/model/water-distance-measurement-mongo-repository')({
  connect: mongodbConnect,
  validate: require('./lib/validation').validateMeasurementObject
});

const app = require('./lib/app')({
  apiToken: API_TOKEN,
  waterDistanceMeasurementRepo: waterDistanceMeasurementRepo
});
// app._router.stack.forEach(function(r){
//   if (r.route && r.route.path){
//     console.log(r.route.path)
//   }
// })

app.listen(PORT, function() {
  console.log(`Server started on port ${PORT}`);
});