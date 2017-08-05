'use strict';

const chai = require('chai');
const expect = require('chai').expect;
const request = require('supertest');

const app = require('./../../lib/app');

describe('/health', function() {
  
  before('mute logger', function() {
    require('cf-nodejs-logging-support').setLoggingLevel('silent');
  });
  
  beforeEach(function() {
    this.headers = {
      'Accept': 'application/json'
    };
    
    this.repo = require('./../util/mock-water-distance-measurement-repository')();
    
    this.app = app({
      apiToken: this.validApiToken,
      waterDistanceMeasurementRepo: this.repo
    });
  });
  
  describe('GET /status', function() {
    
    it('responds with 200 and returns a json status', function(done) {
      
      request(this.app)
        .get('/health/status')
        .set(this.headers)
        .expect(200)
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect({ status: 'ok' })
        .end(done);
    });
  });
});