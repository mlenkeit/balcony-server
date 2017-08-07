'use strict';

const assert = require('assert');
const express = require('express');
const HttpError = require('./../util/HttpError');

const sysInfoBlacklist = ['sw_ver', 'hw_ver', 'mac', 'hwId', 'fwId', 'oemId', 'latitude', 'longitude'];

module.exports = function(config) {
  assert.equal(typeof config.repo, 'object', 'config.repo must be an object');
  
  const router = express.Router();
  
  router.get('/', (req, res, next) => {
    config.repo.findAllInfos()
      .then(plugInfos => {
        return plugInfos.map(info => {
          const sysInfo = Object.assign({}, info.sysInfo);
          sysInfoBlacklist.forEach(prop => delete sysInfo[prop]);
          return sysInfo;
        });
      }).then(sysInfos => res.status(200).json(sysInfos))
      .catch(next);
  });
  
  router.get('/:deviceId', (req, res, next) => {
    config.repo.findById(req.params.deviceId)
      .then(plug => {
        if (!plug) {
          throw new HttpError(404);
        }
        return plug.getInfo();
      })
      .then(info => Object.assign({}, info.sysInfo))
      .then(sysInfo => {
        sysInfoBlacklist.forEach(prop => delete sysInfo[prop]);
        return sysInfo;
      }).then(sysInfo => res.status(200).json(sysInfo))
      .catch(next);
  });
  
  return router;
};