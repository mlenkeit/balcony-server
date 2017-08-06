'use strict';

const express = require('express');

module.exports = function() {
  const router = express.Router();
  
  router.get('/status', (req, res) => {
    res.status(200).json({ 
      status: 'ok',
      version: 'beta-1.0'
    });
  });
  
  return router;
};