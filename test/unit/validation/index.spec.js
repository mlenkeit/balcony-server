'use strict';

const createMeasurementObj = require('./../../fixture/create-measurement-obj');
const createPlugStateObj = require('./../../fixture/create-plug-state-obj');
const expect = require('chai').expect;

const validation = require('./../../../lib/validation/index');

describe('validation', function() {
  
  describe('validateMeasurementObject', function() {
    
    beforeEach(function() {
      this.validate = validation.validateMeasurementObject;
      this.obj = createMeasurementObj();
    });
    
    it('returns true for valid data', function() {
      expect(this.validate(this.obj)).to.equal(true);
    });
    
    describe('returns false when', function() {
      
      it('timestamp property is missing', function() {
        delete this.obj.timestamp;
        expect(this.validate(this.obj)).to.equal(false);
      });
        
      it('sensor property is missing', function() {
        delete this.obj.sensor;
        expect(this.validate(this.obj)).to.equal(false);
      });
        
      it('measurementType property is missing', function() {
        delete this.obj.measurementType;
        expect(this.validate(this.obj)).to.equal(false);
      });
        
      it('measurement property is missing', function() {
        delete this.obj.measurement;
        expect(this.validate(this.obj)).to.equal(false);
      });
        
      it('measurementUnit property is missing', function() {
        delete this.obj.measurementUnit;
        expect(this.validate(this.obj)).to.equal(false);
      });
      
    });
  });
    
  describe('validatePlugState', function() {
    
    beforeEach(function() {
      this.validate = validation.validatePlugStateObj;
      this.obj = createPlugStateObj();
    });
    
    it('returns true for valid data', function() {
      expect(this.validate(this.obj)).to.equal(true);
    });
    
    describe('returns false when', function() {
      
      it('deviceId property is missing', function() {
        delete this.obj.deviceId;
        expect(this.validate(this.obj)).to.equal(false);
      });
        
      it('relayState property is missing', function() {
        delete this.obj.relayState;
        expect(this.validate(this.obj)).to.equal(false);
      });
    });
  });
});