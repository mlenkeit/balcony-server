'use strict';

const expect = require('chai').expect;

const repo = require('./../../../lib/model/linque-repo');

describe('model/linque-repo', function() {
  
  beforeEach(function() {
    this.mongodbConnect = require('./../../../lib/model/mongodb-connector')({
      url: 'mongodb://localhost:27017'
    });
    
    this.repo = repo({
      connect: this.mongodbConnect
    });
  });
  
  afterEach(function() {
    return this.mongodbConnect()
      .then(db => db.collection('linque-info'))
      .then(col => col.deleteMany());
  });
  
  it('throws an exception when called without config.connect', function() {
    expect(() => repo({ }))
      .to.throw();
  });
  
  describe('#update', function() {

    context('with valid data', function() {

      it('updates data', function() {
        const linkInfo = { url: 'http://localhost:1233' };
        return this.repo.update(linkInfo)
          .then(createdLinkInfo => {
            expect(createdLinkInfo).to.equal(createdLinkInfo);
          });
      });
    });
  });
  
  describe('#readAll', function() {
    
    context('with no data', function() {
    
      it('resolves to an empty object', function() {
        return this.repo.findOne()
          .then(measurementObjs => {
            expect(measurementObjs)
              .to.be.an('object')
              .and.to.have.property('url', '');
          });
      });
    });
    
    context('with data in the db', function() {
      
      beforeEach(function() {
        this.linkInfo = { url: 'http://localhost:1233' };
        return this.repo.update(this.linkInfo);
      });
      
      it('resolve to an array with the data', function() {
        return this.repo.findOne()
          .then(linkInfo => {
            expect(linkInfo)
              .to.have.property('url', this.linkInfo.url);
            expect(linkInfo)
              .to.have.property('last_update');
          });
      });
    });
  });
});