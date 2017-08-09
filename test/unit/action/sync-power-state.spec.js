'use strict';

const chai = require('chai');
const createPlugStateObj = require('./../../fixture/create-plug-state-obj');
const expect = require('chai').expect;
const syncPowerState = require('./../../../lib/action/sync-power-state');

chai.use(require('sinon-chai'));

describe('action/sync-power-state', function() {
  
  beforeEach(function() {
    this.plug = require('./../../util/mock-hs100-api-plug')();
    this.deviceId = this.plug._info.sysInfo.deviceId;
    
    this.plugRepo = require('./../../util/mock-plug-repo')();
    this.plugRepo.findById.withArgs(this.deviceId).resolves(this.plug);
    
    this.plugStateRepo = require('./../../util/mock-plug-state-repo')();
  });
  
  it('resolves the promise after invoking setPowerState', function() {
    this.plugState = createPlugStateObj({ deviceId: this.deviceId });
    this.plugStateRepo.readAll.resolves([this.plugState]);
    
    return syncPowerState({
      plugRepo: this.plugRepo,
      plugStateRepo: this.plugStateRepo
    }).then(() => {
      expect(this.plug.setPowerState).to.be.called;
    });
  });
  
  it('resolves the promise even when invoking setPowerState fails', function() {
    this.plug.setPowerState.rejects();
    this.plugState = createPlugStateObj({ deviceId: this.deviceId });
    this.plugStateRepo.readAll.resolves([this.plugState]);
    
    return syncPowerState({
      plugRepo: this.plugRepo,
      plugStateRepo: this.plugStateRepo
    }).then(() => {
      expect(this.plug.setPowerState).to.be.called;
    });
  });
  
  context('for plug relayState 0', function() {
    
    beforeEach(function() {
      this.plugState = createPlugStateObj({ deviceId: this.deviceId, relayState: 0 });
      this.plugStateRepo.readAll.resolves([this.plugState]);
    });
    
    it('calls setPowerState with false', function() {
      return syncPowerState({
        plugRepo: this.plugRepo,
        plugStateRepo: this.plugStateRepo
      }).then(() => {
        expect(this.plug.setPowerState).to.be.calledWith(false);
      });
    });
  });
  
  context('for plug relayState 1', function() {
    
    beforeEach(function() {
      this.plugState = createPlugStateObj({ deviceId: this.deviceId, relayState: 1 });
      this.plugStateRepo.readAll.resolves([this.plugState]);
    });
    
    it('calls setPowerState with true', function() {
      return syncPowerState({
        plugRepo: this.plugRepo,
        plugStateRepo: this.plugStateRepo
      }).then(() => {
        expect(this.plug.setPowerState).to.be.calledWith(true);
      });
    });
  });
  
  
  
});