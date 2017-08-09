'use strict';

const expect = require('chai').expect;

describe('action/set-power', function() {
  
  beforeEach(function() {
    this.plug = require('./../../util/mock-hs100-api-plug')();
    this.deviceId = this.plug._info.deviceId;
    
    this.plugRepo = require('./../../util/mock-plug-repo')();
    this.plugRepo.findById.withArgs(this.deviceId).resolves(this.plug);
    
    this.plugStateRepo = require('./../../util/mock-plug-state-repo')();
    this.plugStateRepo.upsert.resolves();
  });
  
  context('for value true', function() {
    
    beforeEach(function() {
      this.setPower = require('./../../../lib/action/set-power')({
        plugRepo: this.plugRepo,
        plugStateRepo: this.plugStateRepo,
        value: true
      });
    });
    
    it('resolves the promise after invoking plugStateRepo#upsert', function() {
      return expect(this.setPower(this.deviceId))
        .to.eventually.be.fulfilled
        .then(() => {
          expect(this.plugStateRepo.upsert)
            .to.be.calledWith({ deviceId: this.deviceId, relayState: 1 /*true*/ });
        });
    });
    
    it('calls setPowerState on the plug with true', function() {
      return expect(this.setPower(this.deviceId))
        .to.eventually.be.fulfilled
        .then(() => {
          expect(this.plug.setPowerState).to.be.calledWith(true);
        });
    });
    
    it('resolves the promise even if the plug was not found', function() {
      this.plugRepo.findById.withArgs(this.deviceId).rejects(null);
      return expect(this.setPower(this.deviceId))
        .to.eventually.be.fulfilled;
    });
  });
  
  context('for value false', function() {
    
    beforeEach(function() {
      this.setPower = require('./../../../lib/action/set-power')({
        plugRepo: this.plugRepo,
        plugStateRepo: this.plugStateRepo,
        value: false
      });
    });
    
    it('resolves the promise after invoking plugStateRepo#upsert', function() {
      return expect(this.setPower(this.deviceId))
        .to.eventually.be.fulfilled
        .then(() => {
          expect(this.plugStateRepo.upsert)
            .to.be.calledWith({ deviceId: this.deviceId, relayState: 0 /*false*/ });
        });
    });
    
    it('calls setPowerState on the plug with true', function() {
      return expect(this.setPower(this.deviceId))
        .to.eventually.be.fulfilled
        .then(() => {
          expect(this.plug.setPowerState).to.be.calledWith(false);
        });
    });
    
    it('resolves the promise even if the plug was not found', function() {
      this.plugRepo.findById.withArgs(this.deviceId).rejects(null);
      return expect(this.setPower(this.deviceId))
        .to.eventually.be.fulfilled;
    });
  });
});