'use strict';

const createMeasurementObj = require('./../fixture/create-measurement-obj');
const expect = require('chai').expect;
const request = require('supertest');

const app = require('./../../lib/app');

describe.only('app', function() {
  
  before('mute logger', function() {
    require('cf-nodejs-logging-support').setLoggingLevel('silent');
  });
  
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
    
    this.repo = require('./../util/mock-water-distance-measurement-repository')();
    
    this.app = app({
      apiToken: this.validApiToken,
      buildMetadata: this.buildMetadata,
      waterDistanceMeasurementRepo: this.repo
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
  
  describe('/water-distance-measurement', function() {
    
    describe('GET /', function() {
      
      it('responds with 200 and returns the data from the repo', function(done) {
        const expList = [
          createMeasurementObj()
        ];
        this.repo.readAll.resolves(expList);
        
        request(this.app)
          .get('/water-distance-measurement')
          .set(this.headers)
          .expect(200)
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(expList)
          .end(done);
      });
      
      it('responds with 500 when the repo fails', function(done) {
        this.repo.readAll.rejects();
        
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
        this.repo.getLatestUpdateTimestamps.resolves([date.getTime()]);
        
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
        this.repo.create.resolves();
      });
      
      context('with valid API token', function() {
        
        beforeEach(function() {
          this.headers.Authorization = `token ${this.validApiToken}`;
        });
      
        context('with valid payload', function() {
          
          it('responds with 201 and the created object', function(done) {
            const measurementObj = createMeasurementObj();
            this.repo.create.resolves(measurementObj);
            
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