'use strict';

const assert = require('assert');
const bodyParser = require('body-parser');
const express = require('express');

module.exports = function(config) {
  assert.equal(typeof config.apiToken, 'string', 'config.apiToken must be a string');
  assert.equal(typeof config.repo, 'object', 'config.repo must be an object');
  
  const router = express.Router();
  
  router.use(require('./../middlewares/api-token')({
    apiToken: config.apiToken,
    secureGet: true
  }));
  
  router.get('/', (req, res, next) => {
    config.repo.findOne()
      .then(info => res.status(200).json(info))
      .catch(next);
  });
  
  router.put('/', bodyParser.json(), (req, res, next) => {
    config.repo.update(req.body)
      .then(() => res.status(204).send())
      .catch(next);
  });
  
  router.get('/forward', (req, res, next) => {
    config.repo.findOne()
      .then(info => res.redirect(info.url))
      .catch(next);
  });
  
  return router;
};