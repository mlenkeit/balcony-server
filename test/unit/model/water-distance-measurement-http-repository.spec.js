'use strict';

const chai = require('chai');
const createMeasurementObj = require('./../../fixture/create-measurement-obj');
const expect = require('chai').expect;
const nock = require('nock');
const sinon = require('sinon');
const ValidationError = require('./../../../lib/util/ValidationError');

chai.use(require('chai-as-promised'));

const repo = require('./../../../lib/model/water-distance-measurement-http-repository');

describe('model/water-distance-measurement-http-repository', function() {
  
  beforeEach(function() {
    this.uri = 'http://localhost:3333/wdm';
    this.validate = sinon.stub();
    
    this.repo = repo({
      uri: this.uri,
      validate: this.validate
    });
  });
  
  beforeEach('prepare nock', function() {
    nock.disableNetConnect();
  });
  
  afterEach('clean-up nock', function() {
    nock.cleanAll();
    nock.enableNetConnect();
  });
  
  it('throws an exception when called without config.uri', function() {
    expect(() => repo({ validate: this.validate }))
      .to.throw();
  });
  
  it('throws an exception when called without config.validate', function() {
    expect(() => repo({ uri: this.uri }))
      .to.throw();
  });
  
  describe('#create', function() {

    context('with valid data', function() {
      
      beforeEach(function() {
        this.measurementObj = createMeasurementObj();
        this.validate.returns(true);
        this.scope = nock('http://localhost:3333')
          .post('/wdm', 
            body => body.measurement === this.measurementObj.measurement)
          .reply(201, this.measurementObj);
      });

      it('creates data', function() {
        return this.repo.create(this.measurementObj)
          .then(createdMeasurementObj => {
            expect(createdMeasurementObj).to.deep.equal(this.measurementObj);
            expect(this.scope.isDone, 'nock scope called').to.be.ok;
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
      
      beforeEach(function() {
        this.scope = nock('http://localhost:3333')
          .get('/wdm')
          .reply(200, []);
      });
    
      it('resolves to an empty array', function() {
        return this.repo.readAll()
          .then(measurementObjs => {
            expect(measurementObjs)
              .to.be.an('array')
              .and.to.have.lengthOf(0);
            expect(this.scope.isDone(), 'nock scope called').to.be.ok;
          });
      });
    });
    
    context('with data in the db', function() {
      
      beforeEach(function() {
        this.data = [
          createMeasurementObj(),
          createMeasurementObj()
        ];
        this.scope = nock('http://localhost:3333')
          .get('/wdm')
          .reply(200, this.data);
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