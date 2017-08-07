'use strict';

const chai = require('chai');
const expect = require('chai').expect;
const request = require('supertest');
const sinon = require('sinon');
const validatePublicPlugSysInfoObject = require('./../../lib/validation').validatePublicPlugSysInfoObject;

chai.use(require('sinon-chai'));

const app = require('./../../lib/app-pi');

describe('app-pi', function() {
  
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
    
    this.hs100Client = require('./../util/mock-hs100-api-client')();
    this.plugRepo = require('./../util/mock-plug-repo')();
    
    this.captureDistance = sinon.stub().resolves();
    this.powerOn = sinon.stub().resolves();
    this.powerOff = sinon.stub().resolves();
    this.startIrrigationValve = sinon.stub().resolves();
    this.stopIrrigationValve = sinon.stub().resolves();
    
    this.app = app({
      apiToken: this.validApiToken,
      buildMetadata: this.buildMetadata,
      captureDistance: this.captureDistance,
      hs100Client: this.hs100Client,
      plugRepo: this.plugRepo,
      powerOn: this.powerOn,
      powerOff: this.powerOff,
      startIrrigationValve: this.startIrrigationValve,
      stopIrrigationValve: this.stopIrrigationValve
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
  
  describe('/irrigation-action', function() {
    
    describe('POST /', function() {
      
      context('with valid API token', function() {
        
        beforeEach(function() {
          this.headers.Authorization = `token ${this.validApiToken}`;
        });
        
        it('responds with 400 for non-supported actions', function(done) {
          this.action = {
            action: 'random'
          };
          request(this.app)
            .post('/irrigation-action')
            .send(this.action)
            .set(this.headers)
            .expect(400)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .end(done);
        });
        
        describe('action: start-irrigation-valve', function() {
          
          beforeEach(function() {
            this.valveId = '1';
            this.action = {
              action: 'start-irrigation-valve',
              parameters: [ this.valveId ]
            };
          });
          
          it('responds with 201 and triggers config.startIrrigationValve', function(done) {
            request(this.app)
              .post('/irrigation-action')
              .send(this.action)
              .set(this.headers)
              .expect(201)
              .expect('Content-Type', 'application/json; charset=utf-8')
              .expect(res => expect(this.startIrrigationValve).to.be.calledWith(this.valveId))
              .end(done);
          });
        });
        
        describe('action: stop-irrigation-valve', function() {
          
          beforeEach(function() {
            this.valveId = '1';
            this.action = {
              action: 'stop-irrigation-valve',
              parameters: [ this.valveId ]
            };
          });
          
          it('responds with 201 and triggers config.stopIrrigationValve', function(done) {
            request(this.app)
              .post('/irrigation-action')
              .send(this.action)
              .set(this.headers)
              .expect(201)
              .expect('Content-Type', 'application/json; charset=utf-8')
              .expect(res => expect(this.stopIrrigationValve).to.be.calledWith(this.valveId))
              .end(done);
          });
        });
        
      });
      
      context('with invalid API token', function() {
        
        beforeEach(function() {
          this.headers.Authorization = `token ${this.invalidApiToken}`;
        });
        
        it('responds with 401', function(done) {
          request(this.app)
            .post('/irrigation-action')
            .send({})
            .set(this.headers)
            .expect(401)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .end(done);
        });
      });
      
    });
  });
  
  describe('/plugs', function() {
    
    beforeEach(function() {
      this.plug23 = require('./../util/mock-hs100-api-plug')({ deviceId: '23'});
      this.plug78 = require('./../util/mock-hs100-api-plug')({ deviceId: '78'});
      this.plugRepo.findAllInfos.resolves([
        this.plug23._info,
        this.plug78._info
      ]);
    });
    
    describe('GET /', function() {
      
      it('responds with 200 and an array of the plug info', function(done) {
        request(this.app)
          .get('/plugs')
          .set(this.headers)
          .expect(200)
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(res => {
            expect(res.body).to.have.lengthOf(2);
            res.body.forEach(plugInfo => {
              expect(plugInfo).to.satisfy(validatePublicPlugSysInfoObject);
            });
          })
          .end(done);
      });
    });
    
    describe('GET /:deviceId', function() {
      
      context('when deviceId exists', function() {
        
        it('responds with 200 and the plug info', function(done) {
          const deviceId = this.plug23._info.sysInfo.deviceId;
          this.plugRepo.findById.resolves(this.plug23);
          request(this.app)
            .get('/plugs/' + deviceId)
            .set(this.headers)
            .expect(200)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(res => {
              expect(res.body).to.be.an('object');
              expect(res.body).to.satisfy(validatePublicPlugSysInfoObject);
            })
            .end(done);
        });
      });
        
      context('when deviceId does not exist', function() {
        
        it('responds with 404', function(done) {
          this.plugRepo.findById.resolves(null);
          request(this.app)
            .get('/plugs/' + 67890)
            .set(this.headers)
            .expect(404)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .end(done);
        });
      });
    });
    
    describe('/action', function() {
      
      describe('POST /', function() {
        
        context('with valid API token', function() {
          
          beforeEach(function() {
            this.headers.Authorization = `token ${this.validApiToken}`;
          });
          
          it('responds with 400 for non-supported actions', function(done) {
            this.action = {
              action: 'random'
            };
            request(this.app)
              .post('/plugs/action')
              .send(this.action)
              .set(this.headers)
              .expect(400)
              .expect('Content-Type', 'application/json; charset=utf-8')
              .end(done);
          });
          
          describe('action: power-on', function() {
            
            beforeEach(function() {
              this.deviceId = '1234577654';
              this.action = {
                action: 'power-on',
                parameters: [ this.deviceId ]
              };
            });
            
            it('responds with 201 and triggers config.powerOn', function(done) {
              request(this.app)
                .post('/plugs/action')
                .send(this.action)
                .set(this.headers)
                .expect(201)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(res => expect(this.powerOn).to.be.calledWith(this.deviceId))
                .end(done);
            });
          });
            
          describe('action: power-off', function() {
            
            beforeEach(function() {
              this.deviceId = '1234577654';
              this.action = {
                action: 'power-off',
                parameters: [ this.deviceId ]
              };
            });
            
            it('responds with 201 and triggers config.powerOff', function(done) {
              request(this.app)
                .post('/plugs/action')
                .send(this.action)
                .set(this.headers)
                .expect(201)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(res => expect(this.powerOff).to.be.calledWith(this.deviceId))
                .end(done);
            });
          });
          
        });
        
        context('with invalid API token', function() {
          
          beforeEach(function() {
            this.headers.Authorization = `token ${this.invalidApiToken}`;
          });
          
          it('responds with 401', function(done) {
            request(this.app)
              .post('/plugs/action')
              .send({})
              .set(this.headers)
              .expect(401)
              .expect('Content-Type', 'application/json; charset=utf-8')
              .end(done);
          });
        });
      });
      
    });
  });
  
  describe('/sensor-action', function() {
    
    describe('POST /', function() {
      
      context('with valid API token', function() {
        
        beforeEach(function() {
          this.headers.Authorization = `token ${this.validApiToken}`;
        });
        
        it('responds with 400 for non-supported actions', function(done) {
          this.action = {
            action: 'random'
          };
          request(this.app)
            .post('/sensor-action')
            .send(this.action)
            .set(this.headers)
            .expect(400)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .end(done);
        });
        
        describe('action: capture-distance', function() {
          
          beforeEach(function() {
            this.action = {
              action: 'capture-distance'
            };
          });
          
          it('responds with 201 and triggers config.captureDistance', function(done) {
            request(this.app)
              .post('/sensor-action')
              .send(this.action)
              .set(this.headers)
              .expect(201)
              .expect('Content-Type', 'application/json; charset=utf-8')
              .expect(res => expect(this.captureDistance).to.be.calledOnce)
              .end(done);
          });
        });
      });
      
      context('with invalid API token', function() {
        
        beforeEach(function() {
          this.headers.Authorization = `token ${this.invalidApiToken}`;
        });
        
        it('responds with 401', function(done) {
          request(this.app)
            .post('/sensor-action')
            .send({})
            .set(this.headers)
            .expect(401)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .end(done);
        });
      });
    });
  });
});