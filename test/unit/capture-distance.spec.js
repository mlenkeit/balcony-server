'use strict';

const chai = require('chai');
const expect = require('chai').expect;
const sinon = require('sinon');

chai.use(require('sinon-chai'));

const captureDistance = require('./../../lib/capture-distance');

describe('capture-distance', function() {
  
  context('when called with valid pythonScripts', function() {
    
    beforeEach(function() {
      this.pythonScripts = [
        { name: 'short', command: 'short.py', cwd: '/home'},
        { name: 'long', command: 'long.py', cwd: '/home'}
      ];
      this.exec = sinon.stub().resolves('some output');
    });
    
    it('invokes config.exec with each config.pythonScripts item', function() {
      const p = captureDistance({
        pythonScripts: this.pythonScripts,
        exec: this.exec
      });
      
      return p.then(() => {
        expect(this.exec).to.have.callCount(this.pythonScripts.length);
      });
    });
    
    it('invokes the config.pythonScripts in the given order', function() {
      const firstSpy = sinon.stub().resolves('some output');
      const secondSpy = sinon.stub().resolves('some output');
      this.exec
        .onFirstCall().callsFake(firstSpy)
        .onSecondCall().callsFake(secondSpy);
        
      const p = captureDistance({
        pythonScripts: this.pythonScripts,
        exec: this.exec
      });
      
      return p.then(() => {
        expect(firstSpy).to.be.calledWith(sinon.match('short'));
        expect(secondSpy).to.be.calledWith(sinon.match('long'));
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
        }
      });
      
      return p.then(() => {
        expect(events).to.deep.equal([EVT_CREATED, EVT_RESOLVED, EVT_CREATED, EVT_RESOLVED]);
      });
    });
    
    it('');
  });
  
});