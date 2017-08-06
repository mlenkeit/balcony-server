'use strict';

const createMeasurementObj = require('./../../fixture/create-measurement-obj');
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
      
      it('timestamp propert is missing', function() {
        delete this.obj.timestamp;
        expect(this.validate(this.obj)).to.equal(false);
      });
        
      it('sensor propert is missing', function() {
        delete this.obj.sensor;
        expect(this.validate(this.obj)).to.equal(false);
      });
        
      it('measurementType propert is missing', function() {
        delete this.obj.measurementType;
        expect(this.validate(this.obj)).to.equal(false);
      });
        
      it('measurement propert is missing', function() {
        delete this.obj.measurement;
        expect(this.validate(this.obj)).to.equal(false);
      });
        
      it('measurementUnit propert is missing', function() {
        delete this.obj.measurementUnit;
        expect(this.validate(this.obj)).to.equal(false);
      });
      
    });
  });
});