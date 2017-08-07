'use strict';

const fs = require('fs');
const path = require('path');

const commit = process.env.TRAVIS_COMMIT;
const buildNumber = process.env.TRAVIS_BUILD_NUMBER;
const now = new Date();
const datetime = JSON.stringify(now).substr(1).slice(0, -1); // remove leading/trailing quote
const metadata = {
  buildNumber: buildNumber,
  commit: commit,
  datetime: datetime
};

const filepath = path.resolve(__dirname, './../build-metadata.json');
fs.writeFileSync(filepath, JSON.stringify(metadata, null, '  '));