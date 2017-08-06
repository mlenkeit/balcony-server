'use strict';

const chai = require('chai');
const createMeasurementObj = require('./../../fixture/create-measurement-obj');
const expect = require('chai').expect;
const fs = require('fs');
const sinon = require('sinon');
const tmp = require('tmp');
const ValidationError = require('./../../../lib/util/ValidationError');

chai.use(require('chai-as-promised'));

const writeJSONFile = function(filepath, json) {
  fs.writeFileSync(filepath, JSON.stringify(json));
};
const readJSONFile = function(filepath) {
  return JSON.parse(fs.readFileSync(filepath));
};

const repo = require('./../../../lib/model/water-distance-measurement-file-repository');

describe('model/water-distance-measurement-file-repository', function() {
  
  beforeEach(function() {
    this.filepath = tmp.fileSync().name;
    this.validate = sinon.stub();
    
    this.repo = repo({
      filepath: this.filepath,
      validate: this.validate
    });
  });
  
  it('throws an exception when called without config.filepath', function() {
    expect(() => repo({ validate: this.validate }))
      .to.throw();
  });
  
  it('throws an exception when called without config.validate', function() {
    expect(() => repo({ filepath: this.filepath }))
      .to.throw();
  });
  
  describe('#create', function() {

    context('with valid data', function() {
      
      beforeEach(function() {
        this.validate.returns(true);
      });

      it('creates data', function() {
        const measurementObj = createMeasurementObj();
        return this.repo.create(measurementObj)
          .then(createdMeasurementObj => {
            expect(createdMeasurementObj).to.equal(measurementObj);
            const json = readJSONFile(this.filepath);
            expect(json)
              .to.be.an('array')
              .and.to.have.lengthOf(1);
          });
      });
    });
    
    context('with invalid data', function() {
      
      beforeEach(function() {
        this.validate.returns(false);
        this.validate.errors = new Error();
      });
      
      it('rejects the promise when timestamp is missing', function() {
        const measurementObj = createMeasurementObj();
        return expect(this.repo.create(measurementObj))
          .to.be.rejectedWith(ValidationError);
      });
    });
  });
  
  describe('#readAll', function() {
    
    context('with no data', function() {
    
      it('resolves to an empty array', function() {
        return this.repo.readAll()
          .then(measurementObjs => {
            expect(measurementObjs)
              .to.be.an('array')
              .and.to.have.lengthOf(0);
          });
      });
    });
    
    context('with data in the db', function() {
      
      beforeEach(function() {
        this.data = [
          createMeasurementObj(),
          createMeasurementObj()
        ];
        writeJSONFile(this.filepath, this.data);
      });
      
      it('resolve to an array with the data', function() {
        return this.repo.readAll()
          .then(measurementObjs => {
            expect(measurementObjs)
              .to.be.an('array')
              .and.to.have.lengthOf(this.data.length)
              .and.to.deep.equal(this.data);
          });
      });
    });
  });
});