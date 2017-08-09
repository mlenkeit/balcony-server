'use strict';

const chai = require('chai');
const createPlugStateObj = require('./../../fixture/create-plug-state-obj');
const expect = require('chai').expect;
const sinon = require('sinon');
const ValidationError = require('./../../../lib/util/ValidationError');

chai.use(require('chai-as-promised'));

const repo = require('./../../../lib/model/plug-state-mongo-repo');

describe('model/plug-state-mongo-repo', function() {
  
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
      .then(db => db.collection('plug-state'))
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
        createPlugStateObj({ deviceId: '123' }),
        createPlugStateObj({ deviceId: '456' })
      ];
      this.validate.returns(true);
      return Promise.all(
        this.data.map(data => this.repo.upsert(data))
      );
    });
    
    it('resolve to the number of records', function() {
      return expect(this.repo.count())
        .to.eventually.equal(this.data.length);
    });
  });
  
  describe('#upsert', function() {

    context('with valid data', function() {
      
      beforeEach(function() {
        this.validate.returns(true);
      });

      it('creates data if it does not exist', function() {
        const item = createPlugStateObj();
        return this.repo.upsert(item)
          .then(createdItem => {
            expect(createdItem).to.equal(item);
            return expect(this.repo.count())
              .to.eventually.equal(1);
          });
      });

      it('updates the data if it already exists', function() {
        const deviceId = '123';
        const item = createPlugStateObj({ deviceId: deviceId});
        return this.repo.upsert(item)
          .then((/*createdItem*/) => this.repo.upsert(item))
          .then(createdItem => {
            expect(createdItem).to.equal(item);
            return expect(this.repo.count())
              .to.eventually.equal(1);
          });
      });
    });
    
    context('with invalid data', function() {
      
      beforeEach(function() {
        this.validate.returns(false);
        this.validate.errors = new Error();
      });
      
      it('rejects the promise when timestamp is missing', function() {
        const item = createPlugStateObj();
        return expect(this.repo.upsert(item))
          .to.be.rejectedWith(ValidationError);
      });
    });
  });
  
  describe('#readAll', function() {
    
    context('with no data', function() {
    
      it('resolves to an empty array', function() {
        return this.repo.readAll()
          .then(items => {
            expect(items)
              .to.be.an('array')
              .and.to.have.lengthOf(0);
          });
      });
    });
    
    context('with data in the db', function() {
      
      beforeEach(function() {
        this.data = [
          createPlugStateObj({ deviceId: '123' }),
          createPlugStateObj({ deviceId: '456' })
        ];
        this.validate.returns(true);
        return Promise.all(
          this.data.map(data => this.repo.upsert(data))
        );
      });
      
      it('resolve to an array with the data', function() {
        return this.repo.readAll()
          .then(items => {
            expect(items)
              .to.be.an('array')
              .and.to.have.lengthOf(this.data.length);
            this.data.forEach(data => {
              const item = items.find(item => item.deviceId === data.deviceId);
              expect(item)
                .to.be.an('object')
                .and.to.have.property('relayState', data.relayState);
            });
          });
      });
    });
  });
});