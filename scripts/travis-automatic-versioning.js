'use strict';

const execSync = require('child_process').execSync;
const fs = require('fs');
const path = require('path');

const pkg = require('./../package.json');
const commit = process.env.TRAVIS_COMMIT;
const newVersion = pkg.version + '-' + commit;

const command = `npm version ${newVersion} --no-git-tag-version`;
const options = {
  cwd: path.resolve(__dirname, './..'),
  env: process.env
};
execSync(command, options);
