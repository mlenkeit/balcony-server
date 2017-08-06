'use strict';

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
      apiToken: '123',
      waterDistanceMeasurementRepo: this.repo
    });
  });
  
  describe('GET /status', function() {
    
    it('responds with 200 and returns a json status', function(done) {
      const pkg = require('./../../package.json');
      const date = new Date();
      this.repo.getLatestUpdateTimestamps.resolves([date.getTime()]);
      
      request(this.app)
        .get('/health/status')
        .set(this.headers)
        .expect(200)
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(res => expect(res.body).to.have.property('status', 'ok'))
        .expect(res => expect(res.body).to.have.property('version', pkg.version))
        .expect(res => {
          expect(res.body)
            .to.have.deep.property('latest-updates', [date.toString()]);
        })
        .end(done);
    });
  });
});