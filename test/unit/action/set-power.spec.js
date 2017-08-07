'use strict';

const expect = require('chai').expect;

describe('action/set-power', function() {
  
  beforeEach(function() {
    this.plug = require('./../../util/mock-hs100-api-plug')();
    this.deviceId = this.plug._info.deviceId;
    
    this.plugRepo = require('./../../util/mock-plug-repo')();
    this.plugRepo.findById.withArgs(this.deviceId).resolves(this.plug);
  });
  
  context('for value true', function() {
    
    beforeEach(function() {
      this.setPower = require('./../../../lib/action/set-power')({
        plugRepo: this.plugRepo,
        value: true
      });
    });
  
    it('resolves the promise after invoking setPowerState with true', function() {
      return expect(this.setPower(this.deviceId))
        .to.eventually.be.fulfilled
        .then(() => {
          expect(this.plug.setPowerState).to.be.calledWith(true);
        });
    });
  });
  
  context('for value false', function() {
    
    beforeEach(function() {
      this.setPower = require('./../../../lib/action/set-power')({
        plugRepo: this.plugRepo,
        value: false
      });
    });
  
    it('resolves the promise after invoking setPowerState with false', function() {
      return expect(this.setPower(this.deviceId))
        .to.eventually.be.fulfilled
        .then(() => {
          expect(this.plug.setPowerState).to.be.calledWith(false);
        });
    });
  });
});