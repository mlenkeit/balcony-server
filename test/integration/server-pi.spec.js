'use strict';

const bodyParser = require('body-parser');
const expect = require('chai').expect;
const express = require('express');
const fs = require('fs');
const manageChildProcesses = require('./../util/manage-child-processes');
const path = require('path');
const request = require('request');
const sinon = require('sinon');
let spawn;
const tmp = require('tmp');

manageChildProcesses((patchedExec, patchedSpawn) => {
  spawn = patchedSpawn;
});

describe('server-pi.js', function() {
  this.timeout(5000);
  
  before('start server', function() {
    const app = express();
    this.httpSpy = sinon.spy();
    app.use(bodyParser.json(), (req, res) => {
      this.httpSpy(req.uri, req.body, req);
      res.json({});
    });
    this.httpServerPort = 3333;
    this.httpServer = app.listen(this.httpServerPort);
  });
  
  after('stop server', function() {
    this.httpServer.close();
  });
  
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
    this.httpRepoUri = `http://localhost:${this.httpServerPort}`;
    
    const pythonScriptCwd = path.resolve(__dirname, './../fixture');
    const pythonScripts = [
      { name: 'short', command: 'vl53l0x-short-output.py', cwd: pythonScriptCwd},
      { name: 'long', command: 'vl53l0x-long-output.py', cwd: pythonScriptCwd}
    ];
    this.pythonScriptsFilepath = tmp.fileSync().name;
    fs.writeFileSync(this.pythonScriptsFilepath, JSON.stringify(pythonScripts));
    
    this.mongodb_uri = 'mongodb://localhost:27017';
    this.mongoConnect = require('./../../lib/model/mongodb-connector')({
      url: this.mongodb_uri
    });
    
    const command = 'node';
    const args = ['server-pi.js'];
    const env = process.env;
    env.API_TOKEN = this.apiToken;
    env.PORT = this.port;
    env.HTTP_REPO_URI = this.httpRepoUri;
    env.MONGODB_URI = this.mongodb_uri;
    env.PYTHON_SCRIPTS_FILEPATH = this.pythonScriptsFilepath;
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
  
  afterEach('close mongodb connection', function() {
    return this.mongoConnect()
      .then(db => db.close());
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