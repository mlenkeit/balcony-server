'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');

describe('action/set-irrigation-valve', function() {
  
  beforeEach(function() {
    this.plugPump = require('./../../util/mock-hs100-api-plug')({ deviceId: '123'});
    this.plugPumpDeviceId = this.plugPump._info.sysInfo.deviceId;
    this.plugTomatoes = require('./../../util/mock-hs100-api-plug')({ deviceId: '456'});
    this.plugTomatoesDeviceId = this.plugTomatoes._info.sysInfo.deviceId;
    this.plugBalcony = require('./../../util/mock-hs100-api-plug')({ deviceId: '789'});
    this.plugBalconyDeviceId = this.plugBalcony._info.sysInfo.deviceId;
    
    this.plugRepo = require('./../../util/mock-plug-repo')();
    this.plugRepo.findById.withArgs(this.plugPumpDeviceId).resolves(this.plugPump);
    this.plugRepo.findById.withArgs(this.plugTomatoesDeviceId).resolves(this.plugTomatoes);
    this.plugRepo.findById.withArgs(this.plugBalconyDeviceId).resolves(this.plugBalcony);
  });
  
  context('for value true', function() {
    
    beforeEach(function() {
      this.plugOn = sinon.stub().resolves();
      this.plugOff = sinon.stub().resolves();
      this.setIrrigationValve = require('./../../../lib/action/set-irrigation-valve')({
        plugRepo: this.plugRepo,
        plugOn: this.plugOn,
        plugOff: this.plugOff,
        pumpPlugDeviceId: this.plugPumpDeviceId,
        value: true,
        valvePlugDeviceIds: [this.plugTomatoesDeviceId, this.plugBalconyDeviceId]
      });
    });
    
    it('resolves and turns on the pump and the valve', function() {
      return expect(this.setIrrigationValve(this.plugTomatoesDeviceId))
        .to.eventually.be.fulfilled
        .then(() => {
          expect(this.plugOn).to.be.calledWith(this.plugPumpDeviceId);
          expect(this.plugOn).to.be.calledWith(this.plugTomatoesDeviceId);
        });
    });
    
    it('rejects and turns both off if only on can be turned on', function() {
      this.plugOn.onSecondCall().rejects();
      return expect(this.setIrrigationValve(this.plugTomatoesDeviceId))
        .to.eventually.be.rejected
        .then(() => {
          expect(this.plugOff).to.be.calledWith(this.plugPumpDeviceId);
          expect(this.plugOff).to.be.calledWith(this.plugTomatoesDeviceId);
        });
    });
  });
  
  context('for value false', function() {
    
    beforeEach(function() {
      this.plugOn = sinon.stub().resolves();
      this.plugOff = sinon.stub().resolves();
      this.setIrrigationValve = require('./../../../lib/action/set-irrigation-valve')({
        plugRepo: this.plugRepo,
        plugOn: this.plugOn,
        plugOff: this.plugOff,
        pumpPlugDeviceId: this.plugPumpDeviceId,
        value: false,
        valvePlugDeviceIds: [this.plugTomatoesDeviceId, this.plugBalconyDeviceId]
      });
    });
    
    it('resolves and turns off the pump and the valve', function() {
      return expect(this.setIrrigationValve(this.plugTomatoesDeviceId))
        .to.eventually.be.fulfilled
        .then(() => {
          expect(this.plugOff).to.be.calledWith(this.plugPumpDeviceId);
          expect(this.plugOff).to.be.calledWith(this.plugTomatoesDeviceId);
        });
    });
    
    it('resolves and leaves on the pump if another valve is on', function() {
      this.plugBalcony._setSysInfoProp('relay_state', 1);
      return expect(this.setIrrigationValve(this.plugTomatoesDeviceId))
        .to.eventually.be.fulfilled
        .then(() => {
          expect(this.plugOff).not.to.be.calledWith(this.plugPumpDeviceId);
          expect(this.plugOff).to.be.calledWith(this.plugTomatoesDeviceId);
        });
    });
    
    context('when the other plug is not available', function() {
      
      beforeEach(function() {
        this.plugRepo.findById.withArgs(this.plugBalconyDeviceId).resolves(null);
      });
      
      it('resolves and turns off the pump and the valve', function() {
        return expect(this.setIrrigationValve(this.plugTomatoesDeviceId))
          .to.eventually.be.fulfilled
          .then(() => {
            expect(this.plugOff).to.be.calledWith(this.plugPumpDeviceId);
            expect(this.plugOff).to.be.calledWith(this.plugTomatoesDeviceId);
          });
      });
      
    });
    
  });
});