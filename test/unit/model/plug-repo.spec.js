'use strict';

const chai = require('chai');
const expect = require('chai').expect;

chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));

const repo = require('./../../../lib/model/plug-repo');

describe('model/plug-repo', function() {
  
  beforeEach(function() {
    this.hs100Client = require('./../../util/mock-hs100-api-client')();
    
    this.repo = repo({
      client: this.hs100Client,
      discoverTimeout: 100
    });
  });
  
  describe('#discover', function() {
    
    it('starts the discovery on the client', function() {
      this.repo.discover();
      expect(this.hs100Client.startDiscovery).to.be.called;
    });
    
    it('registers to the events only once', function() {
      this.repo.discover();
      expect(this.hs100Client.on).to.have.callCount(3);
      this.repo.discover();
      expect(this.hs100Client.on).to.have.callCount(3);
    });
  });
  
  describe('#findAll', function() {
    
    context('with no plugs', function() {
      
      beforeEach(function() {
        return this.repo.discover();
      });
      
      it('resolves to an empty array', function() {
        return expect(this.repo.findAll())
          .to.eventually.deep.equal([]);
      });
    });
    
    context('with new-plug events emitted', function() {
      
      beforeEach(function() {
        this.plug23 = require('./../../util/mock-hs100-api-plug')({ deviceId: '23'});
        this.plug78 = require('./../../util/mock-hs100-api-plug')({ deviceId: '78'});
        this.hs100Client.emit('plug-new', this.plug23);
        this.hs100Client.emit('plug-new', this.plug78);
      });
      
      it('resolves to an array of plugs from the emitted plugs', function() {
        return expect(this.repo.findAll())
          .to.eventually.have.lengthOf(2)
          .then(plugs => plugs[0])
          .then(plug => plug.getInfo())
          .then(info => {
            expect(info.sysInfo).to.have.property('sw_ver');
          });
      });
    });
  });
  
  describe('#findAllInfos', function() {
    
    context('with no plugs', function() {
      
      beforeEach(function() {
        return this.repo.discover();
      });
      
      it('resolves to an empty array', function() {
        return expect(this.repo.findAllInfos())
          .to.eventually.deep.equal([]);
      });
    });
    
    context('with new-plug events emitted', function() {
      
      beforeEach(function() {
        this.plug23 = require('./../../util/mock-hs100-api-plug')({ deviceId: '23'});
        this.plug78 = require('./../../util/mock-hs100-api-plug')({ deviceId: '78'});
        this.hs100Client.emit('plug-new', this.plug23);
        this.hs100Client.emit('plug-new', this.plug78);
      });
      
      it('resolves to an array of plugs from the emitted plugs', function() {
        return expect(this.repo.findAllInfos())
          .to.eventually.have.lengthOf(2)
          .then(plugInfos => plugInfos[0])
          .then(info => {
            expect(info.sysInfo).to.have.property('sw_ver');
          });
      });
    });
  });
  
  describe('#findById', function() {
  
    context('with new-plug events emitted', function() {
      
      beforeEach(function() {
        this.plug23 = require('./../../util/mock-hs100-api-plug')({ deviceId: '23'});
        this.plug78 = require('./../../util/mock-hs100-api-plug')({ deviceId: '78'});
        this.hs100Client.emit('plug-new', this.plug23);
        this.hs100Client.emit('plug-new', this.plug78);
      });
      
      it('resolves to a plug from the emitted plugs', function() {
        const deviceId = this.plug23._info.sysInfo.deviceId;
        return expect(this.repo.findById(deviceId))
          .to.eventually.be.fulfilled
          .then(plug => plug.getInfo())
          .then(info => {
            expect(info.sysInfo).to.have.property('deviceId', deviceId);
          });
      });
      
      it('resolves to null for a non-existing device id', function() {
        const deviceId = '56876534';
        return expect(this.repo.findById(deviceId))
          .to.eventually.be.null;
      });
    });
    
  });
});