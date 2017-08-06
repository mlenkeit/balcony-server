'use strict';

const async = require('async');
const expect = require('chai').expect;
const kill = require('tree-kill');
const path = require('path');
const request = require('request');
const spawn = require('child_process').spawn;

const createMeasurementObj = function() {
  createMeasurementObj.counter = createMeasurementObj.counter ? ++createMeasurementObj.counter : 1;
  return {
    'timestamp': new Date().getTime(),
    'sensor': 'abc',
    'measurementType': 'short',
    'measurement': 12 + createMeasurementObj.counter,
    'measurementUnit': 'mm' 
  };
};

describe('server.js', function() {
  
  beforeEach(function() {
    this.cps = [];
  });
  
  afterEach(function(done) {
    async.each(this.cps, (cp, cb) => {
      kill(cp.pid, 'SIGKILL', err => cb());
    }, done);
  });
  
  beforeEach(function() {
    this.apiToken = '1234';
    this.port = 3010;
    
    const command = 'npm';
    const args = ['run', 'start:server'];
    const env = process.env;
    env.api_token = this.apiToken;
    env.PORT = this.port;
    const options = {
      cwd: path.resolve(__dirname, './../../'),
      env: env
    };
    const cp = spawn(command, args, options);
    this.cps.push(cp);
    cp.stdout.on('data', data => console.log(data.toString()));
    cp.stderr.on('data', data => {
      console.log(data.toString());
      throw new Error('Received unexpected data on stderr');
    });
    this.pServerStarted = (() => {
      return new Promise((resolve, reject) => {
        cp.stdout.on('data', data => {
          const matches = /port (\d+)/i.exec(data.toString());
          if (matches) {
            resolve(matches[1]);
          }
        });
      });
    })();
  });
  
  describe('endpoints', function() {
  
    it('GET /water-distance-measurement returns an array', function(done) {
      this.pServerStarted.then(() => {
        request.get({
          uri: `http://localhost:${this.port}/water-distance-measurement`,
          json: true
        }, (err, res, body) => {
          expect(err).to.equal(null);
          expect(res.statusCode).to.equal(200);
          expect(body).to.be.an('array');
          done();
        });
      });
    });
    
    it('POST /water-distance-measurement with api token returns created object', function(done) {
      const measurementObj = createMeasurementObj();
      this.pServerStarted.then(() => {
        request.post({
          uri: `http://localhost:${this.port}/water-distance-measurement`,
          json: measurementObj,
          headers: {
            Authorization: `token ${this.apiToken}`
          }
        }, (err, res, body) => {
          expect(err).to.equal(null);
          expect(res.statusCode).to.equal(201);
          expect(body).to.be.an('object');
          done();
        });
      });
    });
    
  });
});