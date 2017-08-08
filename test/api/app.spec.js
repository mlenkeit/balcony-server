'use strict';

const createMeasurementObj = require('./../fixture/create-measurement-obj');
const expect = require('chai').expect;
const request = require('supertest');

const app = require('./../../lib/app');

describe('app', function() {
  
  beforeEach(function() {
    this.validApiToken = '123';
    this.invalidApiToken = '999';
    this.buildMetadata = {
      buildNumber: '1',
      commit: '123',
      datetime: 'date'
    };
    
    this.headers = {
      'Accept': 'application/json'
    };
    
    this.linqueRepo = require('./../util/mock-linque-repo')();
    this.waterDistanceMeasurementRepo = require('./../util/mock-water-distance-measurement-repository')();
    
    this.app = app({
      apiToken: this.validApiToken,
      buildMetadata: this.buildMetadata,
      linqueRepo: this.linqueRepo,
      waterDistanceMeasurementRepo: this.waterDistanceMeasurementRepo
    });
  });
  
  describe('/health', function() {
    
    describe('GET /status', function() {
      
      it('responds with 200 and returns a json status', function(done) {
        const pkg = require('./../../package.json');
        request(this.app)
          .get('/health/status')
          .set(this.headers)
          .expect(200)
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(res => expect(res.body).to.have.property('status', 'ok'))
          .expect(res => expect(res.body).to.have.property('version', pkg.version))
          .expect(res => expect(res.body).to.have.deep.property('build-metadata', this.buildMetadata))
          .end(done);
      });
    });
  });
  
  describe('/linque', function() {
    
    describe('GET /', function() {
      
      context('with valid API token', function() {
        
        beforeEach(function() {
          this.headers.Authorization = `token ${this.validApiToken}`;
        });
        
        it('responds with 200 and latest link info', function(done) {
          const linkInfo = {
            url: 'http://test.com',
            last_update: '123'
          };
          this.linqueRepo.findOne.resolves(linkInfo);
          request(this.app)
            .get('/linque')
            .set(this.headers)
            .expect(200)
            .expect(linkInfo)
            .end(done);
        });
        
      });
      
      context('with invalid API token', function() {
        
        beforeEach(function() {
          this.headers.Authorization = `token ${this.invalidApiToken}`;
        });
        
        it('responds with 401', function(done) {
          request(this.app)
            .get('/linque')
            .set(this.headers)
            .expect(401)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .end(done);
        });
      });
    });
      
    describe('GET /forward', function() {
      
      context('with valid API token', function() {
        
        beforeEach(function() {
          this.headers.Authorization = `token ${this.validApiToken}`;
        });
        
        it('responds with 302 redirect', function(done) {
          const linkInfo = {
            url: 'http://test.com',
            last_update: '123'
          };
          this.linqueRepo.findOne.resolves(linkInfo);
          request(this.app)
            .get('/linque/forward')
            .set(this.headers)
            .expect(302)
            .expect('location', linkInfo.url)
            .end(done);
        });
        
      });
      
      context('with invalid API token', function() {
        
        beforeEach(function() {
          this.headers.Authorization = `token ${this.invalidApiToken}`;
        });
        
        it('responds with 401', function(done) {
          request(this.app)
            .get('/linque/forward')
            .set(this.headers)
            .expect(401)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .end(done);
        });
      });
    });
      
    describe('PUT /', function() {
      
      context('with valid API token', function() {
        
        beforeEach(function() {
          this.headers.Authorization = `token ${this.validApiToken}`;
        });
        
        it('responds with 204 and update the link repo', function(done) {
          const linkInfo = {
            url: 'http://test.com'
          };
          this.linqueRepo.update.withArgs(linkInfo).resolves();
          request(this.app)
            .put('/linque')
            .send(linkInfo)
            .set(this.headers)
            .expect(204)
            .expect(() => expect(this.linqueRepo.update).to.be.calledWith(linkInfo))
            .end(done);
        });
        
      });
      
      context('with invalid API token', function() {
        
        beforeEach(function() {
          this.headers.Authorization = `token ${this.invalidApiToken}`;
        });
        
        it('responds with 401', function(done) {
          const linkInfo = {
            url: 'http://test.com'
          };
          request(this.app)
            .put('/linque')
            .send(linkInfo)
            .set(this.headers)
            .expect(401)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .end(done);
        });
      });
    });
    
  });
  
  describe('/water-distance-measurement', function() {
    
    describe('GET /', function() {
      
      it('responds with 200 and returns the data from the repo', function(done) {
        const expList = [
          createMeasurementObj()
        ];
        this.waterDistanceMeasurementRepo.readAll.resolves(expList);
        
        request(this.app)
          .get('/water-distance-measurement')
          .set(this.headers)
          .expect(200)
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(expList)
          .end(done);
      });
      
      it('responds with 500 when the repo fails', function(done) {
        this.waterDistanceMeasurementRepo.readAll.rejects();
        
        request(this.app)
          .get('/water-distance-measurement')
          .set(this.headers)
          .expect(500)
          .expect('Content-Type', 'application/json; charset=utf-8')
          .end(done);
      });
      
    });
    
    describe('GET /stats', function() {
      
      it('responds with 200 and contains some stats', function(done) {
        const date = new Date();
        this.waterDistanceMeasurementRepo.getLatestUpdateTimestamps.resolves([date.getTime()]);
        
        request(this.app)
          .get('/water-distance-measurement/stats')
          .set(this.headers)
          .expect(200)
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(res => {
            expect(res.body)
              .to.have.deep.property('latest-updates', [date.toString()]);
          })
          .end(done);
        
      });
      
    });
    
    describe('POST /', function() {
      
      beforeEach(function() {
        this.waterDistanceMeasurementRepo.create.resolves();
      });
      
      context('with valid API token', function() {
        
        beforeEach(function() {
          this.headers.Authorization = `token ${this.validApiToken}`;
        });
      
        context('with valid payload', function() {
          
          it('responds with 201 and the created object', function(done) {
            const measurementObj = createMeasurementObj();
            this.waterDistanceMeasurementRepo.create.resolves(measurementObj);
            
            request(this.app)
              .post('/water-distance-measurement')
              .send(measurementObj)
              .set(this.headers)
              .expect(201)
              .expect(measurementObj)
              .end(done);
          });
        });
          
        // context('with in status', function() {
        //   
        //   it('responds with 400', function(done) {
        //     request(this.app)
        //       .put(`/status/${this.validDeviceSerialNumber}`)
        //       .send({ status: 'blue' })
        //       .set('Accept', 'application/json')
        //       .set('Authorization', `token ${this.validApiToken}`)
        //       .expect(400)
        //       .expect('Content-Type', 'application/json; charset=utf-8')
        //       .end(done)
        //   });
        // });
      });
      
      context('with invalid API token', function() {
        
        beforeEach(function() {
          this.headers.Authorization = `token ${this.invalidApiToken}`;
        });
        
        it('responds with 401', function(done) {
          request(this.app)
            .post('/water-distance-measurement')
            .send(createMeasurementObj())
            .set(this.headers)
            .expect(401)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .end(done);
        });
      });
    });
  });
});