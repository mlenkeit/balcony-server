'use strict';

const express = require('express');
const pkg = require('./../../package.json');

module.exports = function() {
  const router = express.Router();
  
  router.get('/status', (req, res) => {
    res.status(200).json({ 
      status: 'ok',
      version: pkg.version
    });
  });
  
  return router;
};