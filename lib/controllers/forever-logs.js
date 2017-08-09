'use strict';

const assert = require('assert');
const express = require('express');
const fs = require('fs');

module.exports = function(config) {
  assert.equal(typeof config.apiToken, 'string', 'config.apiToken must be a string');
  assert.equal(typeof config.exec, 'function', 'config.exec must be a function');
  
  const router = express.Router();
  
  router.use(require('./../middlewares/api-token')({
    apiToken: config.apiToken,
    secureGet: true
  }));
  
  router.get('/', (req, res, next) => {
    config.exec('sudo $(which forever) logs --no-colors')
      .then(stdout => stdout.split('\n'))
      .then(lines => lines.find(line => /server-pi\.js/.test(line)))
      .then(line => {
        if (!line) throw new Error('Could not find script server-pi.js');
        const matches = /(\/[^\s]+\.log)/.exec(line);
        if (!matches) throw new Error('Could not find log file path');
        const filepath = matches[1];
        const buffer = fs.readFileSync(filepath);
        return buffer.toString();
      })
      .then(logs => res.status(200).send(logs))
      .catch(next);
  });
  
  return router;
};