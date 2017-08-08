'use strict';

const chai = require('chai');
const createMeasurementObj = require('./../../fixture/create-measurement-obj');
const expect = require('chai').expect;
const sinon = require('sinon');
const ValidationError = require('./../../../lib/util/ValidationError');

chai.use(require('chai-as-promised'));

const repo = require('./../../../lib/model/water-distance-measurement-mongo-repository');

describe('model/water-distance-measurement-mongo-repository', function() {
  
  beforeEach(function() {
    this.mongodbConnect = require('./../../../lib/model/mongodb-connector')({
      url: 'mongodb://localhost:27017'
    });
    this.validate = sinon.stub();
    
    this.repo = repo({
      connect: this.mongodbConnect,
      validate: this.validate
    });
  });
  
  afterEach(function() {
    return this.mongodbConnect()
      .then(db => db.collection('water-distance-measurement'))
      .then(col => col.deleteMany());
  });
  
  it('throws an exception when called without config.connect', function() {
    expect(() => repo({ validate: this.validate }))
      .to.throw();
  });
  
  it('throws an exception when called without config.validate', function() {
    expect(() => repo({ connect: this.connect }))
      .to.throw();
  });
  
  describe('#count', function() {
    
    beforeEach(function() {
      this.data = [
        createMeasurementObj(),
        createMeasurementObj()
      ];
      this.validate.returns(true);
      return Promise.all(
        this.data.map(data => this.repo.create(data))
      );
    });
    
    it('resolve to the number of records', function() {
      return expect(this.repo.count())
        .to.eventually.equal(this.data.length);
    });
  });
  
  describe('#getAverage', function() {
    
    beforeEach(function() {
      this.rawData = [{
        date: new Date('2017-08-01'),
        measurements: [10, 20, 30]
      }, {
        date: new Date('2017-08-02'),
        measurements: [1, 2, 3]
      }, {
        date: new Date('2017-08-03'),
        measurements: [100, 200, 300]
      }];
      this.data = this.rawData.reduce((arr, item) => {
        item.measurements.forEach(m => {
          const mO = createMeasurementObj();
          mO.timestamp = item.date.getTime();
          mO.measurement = m;
          arr.push(mO);
          const m1 = Object.assign({}, mO);
          m1.measurementType = 'long';
          arr.push(m1);
        });
        return arr;
      }, []);
      this.validate.returns(true);
      return Promise.all(
        this.data.map(data => this.repo.create(data))
      );
    });
    
    it('returns the average measurement by timestamp', function() {
      return expect(this.repo.getAverage())
        .to.eventually.be.fulfilled
        .then(result => {
          expect(result)
            .to.be.an('array')
            .and.to.have.lengthOf(this.rawData.length * 2);
          // console.log(result);
          // console.log(result.length);
        });
    });
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
        this.validate.returns(true);
        return Promise.all(
          this.data.map(data => this.repo.create(data))
        );
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
  
  describe('#getLatestUpdateTimestamps', function() {
    
    context('with no data', function() {
    
      it('resolves to an empty array', function() {
        return this.repo.getLatestUpdateTimestamps()
          .then(timestamps => {
            expect(timestamps)
              .to.be.an('array')
              .and.to.have.lengthOf(0);
          });
      });
    });
    
    context('with data in the db', function() {
      
      beforeEach(function() {
        this.oldestTimestamp = new Date('2017-01-01').getTime();
        this.latestTimestamp = new Date('2017-02-01').getTime();
        this.oldestMeasurementObj = createMeasurementObj();
        this.oldestMeasurementObj.timestamp = this.oldestTimestamp;
        this.anotherOldestMeasurementObj = createMeasurementObj();
        this.anotherOldestMeasurementObj.timestamp = this.oldestTimestamp;
        this.latestMeasurementObj = createMeasurementObj();
        this.latestMeasurementObj.timestamp = this.latestTimestamp;
        
        this.data = [
          this.latestMeasurementObj,
          this.oldestMeasurementObj,
          this.anotherOldestMeasurementObj
        ];
        this.validate.returns(true);
        return Promise.all(
          this.data.map(data => this.repo.create(data))
        );
      });
      
      it('resolve to an array with the corresponding timestamps', function() {
        return this.repo.getLatestUpdateTimestamps()
          .then(timestamps => {
            expect(timestamps)
              .to.be.an('array')
              .and.to.have.lengthOf(2)
              .and.to.deep.equal([this.latestTimestamp, this.oldestTimestamp]);
          });
      });
      
      it('resolve to an array with the corresponding timestamps', function() {
        return this.repo.getLatestUpdateTimestamps(1)
          .then(timestamps => {
            expect(timestamps)
              .to.be.an('array')
              .and.to.have.lengthOf(1)
              .and.to.deep.equal([this.latestTimestamp]);
          });
      });
    });
  });
});