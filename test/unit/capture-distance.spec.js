'use strict';

const chai = require('chai');
const expect = require('chai').expect;
const mockRepo = require('./../util/mock-water-distance-measurement-repository');
const path = require('path');
const sinon = require('sinon');
const validateMeasurementObject = require('./../../lib/validation').validateMeasurementObject;

chai.use(require('sinon-chai'));

const shortOutput = `Timing 33 ms
643 mm, 64 cm, 1
655 mm, 65 cm, 2
611 mm, 61 cm, 3`;
const longOutput = `Timing 33 ms
743 mm, 74 cm, 1
755 mm, 75 cm, 2
711 mm, 71 cm, 3`;

const captureDistance = require('./../../lib/capture-distance');

describe('capture-distance', function() {
  
  beforeEach(function() {
    const cwd = path.resolve(__dirname, './../fixtures');
    this.pythonScripts = [
      { name: 'short', command: 'vl53l0x-short-output.py', cwd: cwd},
      { name: 'long', command: 'vl53l0x-long-output.py', cwd: cwd}
    ];
    
    this.exec = sinon.stub().resolves('');
    this.exec.withArgs(sinon.match('short')).resolves(shortOutput);
    this.exec.withArgs(sinon.match('long')).resolves(longOutput);
    
    this.repo = mockRepo();
    this.repo.create.resolves();
    this.repos = [this.repo];
  });
  
  it('throws an exception when called without config.pythonScripts', function() {
    const config = {
      exec: this.exec,
      repos: this.repos
    };
    expect(() => captureDistance(config))
      .to.throw();
  });
  
  it('throws an exception when called without config.exec', function() {
    const config = {
      pythonScripts: this.pythonScripts,
      repos: this.repos
    };
    expect(() => captureDistance(config))
      .to.throw();
  });
  
  it('throws an exception when called without config.repos', function() {
    const config = {
      exec: this.exec,
      pythonScripts: this.pythonScripts
    };
    expect(() => captureDistance(config))
      .to.throw();
  });
  
  context('when called with valid pythonScripts', function() {
    
    it('invokes config.exec with each config.pythonScripts item', function() {
      const p = captureDistance({
        pythonScripts: this.pythonScripts,
        exec: this.exec,
        repos: this.repos
      });
      
      return p.then(() => {
        expect(this.exec).to.have.callCount(this.pythonScripts.length);
      });
    });
    
    it('invokes the config.pythonScripts in the given order', function() {
      const firstSpy = sinon.stub().resolves(shortOutput);
      const secondSpy = sinon.stub().resolves(longOutput);
      this.exec.reset();
      this.exec
        .onFirstCall().callsFake(firstSpy)
        .onSecondCall().callsFake(secondSpy);
        
      const p = captureDistance({
        pythonScripts: this.pythonScripts,
        exec: this.exec,
        repos: this.repos
      });
      
      return p.then(() => {
        expect(firstSpy).to.be.calledWith(sinon.match('vl53l0x-short-output.py'));
        expect(secondSpy).to.be.calledWith(sinon.match('vl53l0x-long-output.py'));
      });
    });
    
    it('invokes the config.pythonScripts one at a time', function() {
      const events = [];
      const EVT_CREATED = 'created', EVT_RESOLVED = 'resolved';
      const p = captureDistance({
        pythonScripts: this.pythonScripts,
        exec: function(command) {
          const stub = sinon.stub().resolves('some output');
          events.push(EVT_CREATED);
          const res = stub.apply(null, arguments);
          res.then(() => events.push(EVT_RESOLVED));
          return res;
        },
        repos: this.repos
      });
      
      return p.then(() => {
        expect(events).to.deep.equal([EVT_CREATED, EVT_RESOLVED, EVT_CREATED, EVT_RESOLVED]);
      });
    });
    
    it('invokes the config.repos#create method', function() {
      const assertDone = sinon.spy();
      const p = captureDistance({
        pythonScripts: this.pythonScripts,
        exec: this.exec,
        repos: this.repos
      });
      p.then(assertDone);
      
      return p.then(() => {
        expect(this.repo.create)
          .to.be.called
          .and.to.have.always.been.calledWith(sinon.match(validateMeasurementObject));
        expect(this.repo.create)
          .to.be.calledBefore(assertDone);
      });
    });
  });
  
});