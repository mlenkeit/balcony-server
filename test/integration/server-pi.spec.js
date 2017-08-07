'use strict';

const expect = require('chai').expect;
const fs = require('fs');
const manageChildProcesses = require('./../util/manage-child-processes');
const path = require('path');
const request = require('request');
let spawn;

manageChildProcesses((patchedExec, patchedSpawn) => {
  spawn = patchedSpawn;
});

describe('server-pi.js', function() {
  
  beforeEach('set-up build-metadata', function() {
    this.buildMetadataFilepath = path.resolve(__dirname, './../../build-metadata.json');
    this.buildMetadata = {
      buildNumber: '1',
      commit: '123',
      datetime: 'date'
    };
    fs.writeFileSync(this.buildMetadataFilepath, JSON.stringify(this.buildMetadata));
  });
  
  afterEach('clean-up build-metadata', function() {
    if (fs.existsSync(this.buildMetadataFilepath)) {
      fs.unlinkSync(this.buildMetadataFilepath);
    }
  });
  
  beforeEach(function() {
    this.apiToken = '1234';
    this.port = 3010;
    
    const command = 'node';
    const args = ['server-pi.js'];
    const env = process.env;
    env.api_token = this.apiToken;
    env.PORT = this.port;
    const options = {
      cwd: path.resolve(__dirname, './../../'),
      env: env
    };
    const cp = spawn(command, args, options);
    cp.stdout.on('data', data => console.log(data.toString()));
    cp.stderr.on('data', data => {
      console.log(data.toString());
      throw new Error('Received unexpected data on stderr');
    });
    this.pServerStarted = (() => {
      return new Promise((resolve/*, reject*/) => {
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
    
    it('GET /health/status contains data from build-metadata.json', function(done) {
      this.pServerStarted.then(() => {
        request.get({
          uri: `http://localhost:${this.port}/health/status`,
          json: true
        }, (err, res, body) => {
          expect(err).to.equal(null);
          expect(res.statusCode).to.equal(200);
          expect(body).to.be.an('object');
          expect(body).to.have.deep.property('build-metadata', this.buildMetadata);
          done();
        });
      });
    });
    
  });
});