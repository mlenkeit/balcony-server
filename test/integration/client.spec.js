'use strict';

const bodyParser = require('body-parser');
const chai = require('chai');
let exec;
const expect = require('chai').expect;
const express = require('express');
const fs = require('fs');
const manageChildProcesses = require('./../util/manage-child-processes');
const path = require('path');
const sinon = require('sinon');
let spawn;
const tmp = require('tmp');
const validateMeasurementObject = require('./../../lib/validation').validateMeasurementObject;

chai.use(require('sinon-chai'));

manageChildProcesses((patchedExec, patchedSpawn) => {
  exec = patchedExec;
  spawn = patchedSpawn;
});

describe('client.js', function() {
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
  
  beforeEach(function(done) {
    this.httpSpy.reset();
    
    const pythonScriptCwd = path.resolve(__dirname, './../fixture');
    const pythonScripts = [
      { name: 'short', command: 'vl53l0x-short-output.py', cwd: pythonScriptCwd},
      { name: 'long', command: 'vl53l0x-long-output.py', cwd: pythonScriptCwd}
    ];
    this.pythonScriptsFilepath = tmp.fileSync().name;
    fs.writeFileSync(this.pythonScriptsFilepath, JSON.stringify(pythonScripts));
    
    this.measurementsFilepath = tmp.fileSync().name;
    this.httpRepoUri = `http://localhost:${this.httpServerPort}`;
    this.mongodb_uri = 'mongodb://localhost:27017';
    
    this.mongoConnect = require('./../../lib/model/mongodb-connector')({
      url: this.mongodb_uri
    });
    
    const command = 'npm';
    const args = ['run', 'start:client'];
    const env = process.env;
    env.python_scripts_filepath = this.pythonScriptsFilepath;
    env.measurements_filepath = this.measurementsFilepath;
    env.http_repo_uri = this.httpRepoUri;
    env.MONGODB_URI = this.mongodb_uri;
    const options = {
      cwd: path.resolve(__dirname, './../../'),
      env: env
    };
    const cp = spawn(command, args, options);
    cp.stdout.on('data', data => {
      console.log(data.toString());
    });
    cp.stderr.on('data', data => {
      console.log(data.toString());
      throw new Error('Received unexpected data on stderr');
    });
    cp.on('exit', done);
  });
  
  afterEach('close mongodb connection', function() {
    return this.mongoConnect()
      .then(db => db.close());
  });
  
  it('writes data to the specified file', function() {
    const contents = fs.readFileSync(this.measurementsFilepath);
    const measurementObjs = JSON.parse(contents);
    expect(measurementObjs)
      .to.be.an('array');
    measurementObjs.forEach(measurementObj => {
      expect(measurementObj, 'match measurement schema')
        .to.satisfy(validateMeasurementObject);
    });
  });
  
  it('writes data to the http endpoint', function() {
    expect(this.httpSpy).to.be.called;
    const firstBody = this.httpSpy.args[0][1];
    expect(firstBody, 'match measurement schema')
      .to.satisfy(validateMeasurementObject);
  });
  
  it('writes data to mongodb', function() {
    return this.mongoConnect()
      .then(db => db.collection('water-distance-measurement'))
      .then(col => col.find().toArray())
      .then(measurementObjs => {
        expect(measurementObjs)
          .to.be.an('array');
        measurementObjs.forEach(measurementObj => {
          expect(measurementObj, 'match measurement schema')
            .to.satisfy(validateMeasurementObject);
        });
      });
  });
  
});