'use strict';

const bodyParser = require('body-parser');
const expect = require('chai').expect;
const express = require('express');
const fs = require('fs');
const hs100Decrypt = require('hs100-api/lib/utils').decrypt;
const hs100Encrypt = require('hs100-api/lib/utils').encrypt;
const hs100EncryptWithHeader = require('hs100-api/lib/utils').encryptWithHeader;
const manageChildProcesses = require('./../util/manage-child-processes');
const path = require('path');
const request = require('request');
const sinon = require('sinon');
let spawn;
const tmp = require('tmp');

manageChildProcesses((patchedExec, patchedSpawn) => {
  spawn = patchedSpawn;
});

describe('server-pi.js', function() {
  this.timeout(5000);
  
  before('start server', function() {
    const app = express();
    this.httpSpy = sinon.spy();
    app.use(bodyParser.json(), (req, res) => {
      this.httpSpy(req.uri, req.body, req);
      res.json({});
    });
    this.httpServerPort = 3333;
    this.httpServer = app.listen(this.httpServerPort);
    
    const dgram = require('dgram');
    this.s = dgram.createSocket('udp4', (msg, rinfo) => {
      // console.log('UDP message');
      const message = hs100Encrypt(JSON.stringify({
        system: {
          get_sysinfo: {
            err_code: 0,
            sw_ver: '1.1.3 Build 170608 Rel.204734',
            hw_ver: '1.0',
            type: 'IOT.SMARTPLUGSWITCH',
            model: 'HS100(EU)',
            mac: '11:22:33:44:55:66',
            deviceId: '2345678098765345678909876545678909876567',
            hwId: '56896548987656789098765678987678',
            fwId: '98765749865765678765678987789890',
            oemId: '68767867876878909098989098789899',
            alias: 'MyPlug',
            dev_name: 'Wi-Fi Smart Plug',
            icon_hash: '',
            relay_state: 0,
            on_time: 0,
            active_mode: 'schedule',
            feature: 'TIM',
            updating: 0,
            rssi: -55,
            led_off: 0,
            latitude: 49.381825,
            longitude: 8.690409
          }
        },
        emeter: {
          get_realtime: {}
        }
      }));
      // console.log('usBuffer', Buffer.isBuffer(msg));
      this.s.send(message, 0, message.length, rinfo.port, rinfo.address);
    });
    this.s.bind(9999);
    
    const net = require('net');
    this.netServer = net.createServer(conn => {
      conn.on('data', (data) => {
        // console.log(hs100Decrypt(data).toString('ascii'));
        // console.log(hs100Decrypt(data.slice(4)).toString('ascii'));
        const myMsg = hs100EncryptWithHeader(JSON.stringify({
          system: {
            get_sysinfo: {
              err_code: 0,
              sw_ver: '1.1.3 Build 170608 Rel.204734',
              hw_ver: '1.0',
              type: 'IOT.SMARTPLUGSWITCH',
              model: 'HS100(EU)',
              mac: '11:22:33:44:55:66',
              deviceId: '2345678098765345678909876545678909876567',
              hwId: '56896548987656789098765678987678',
              fwId: '98765749865765678765678987789890',
              oemId: '68767867876878909098989098789899',
              alias: 'MyPlug',
              dev_name: 'Wi-Fi Smart Plug',
              icon_hash: '',
              relay_state: 0,
              on_time: 0,
              active_mode: 'schedule',
              feature: 'TIM',
              updating: 0,
              rssi: -55,
              led_off: 0,
              latitude: 49.381825,
              longitude: 8.690409
            }
          },
          cnCloud: {
            get_info: {
              
            }
          },
          emeter: {
            get_realtime: {}
          },
          schedule: {
            get_next_action: {
              
            }
          }
        }));
        
        conn.write(myMsg);
      });
    });
    this.netServer.listen(9999);
  });
  
  after('stop server', function() {
    this.httpServer.close();
    this.s.close();
    this.netServer.close();
  });
  
  beforeEach('set-up build-metadata', function() {
    this.buildMetadataFilepath = path.resolve(__dirname, './../../build-metadata.json');
    this.buildMetadata = {
      buildNumber: '1',
      commit: '123',
      datetime: 'date'
    };
    fs.writeFileSync(this.buildMetadataFilepath, JSON.stringify(this.buildMetadata));
  });
  
  afterEach('clean-up build-metadata', function() {
    if (fs.existsSync(this.buildMetadataFilepath)) {
      fs.unlinkSync(this.buildMetadataFilepath);
    }
  });
  
  beforeEach(function() {
    this.apiToken = '1234';
    this.port = 3010;
    this.httpRepoUri = `http://localhost:${this.httpServerPort}`;
    
    const pythonScriptCwd = path.resolve(__dirname, './../fixture');
    const pythonScripts = [
      { name: 'short', command: 'vl53l0x-short-output.py', cwd: pythonScriptCwd},
      { name: 'long', command: 'vl53l0x-long-output.py', cwd: pythonScriptCwd}
    ];
    this.pythonScriptsFilepath = tmp.fileSync().name;
    fs.writeFileSync(this.pythonScriptsFilepath, JSON.stringify(pythonScripts));
    
    this.mongodb_uri = 'mongodb://localhost:27017';
    this.mongoConnect = require('./../../lib/model/mongodb-connector')({
      url: this.mongodb_uri
    });
    
    const command = 'node';
    const args = ['server-pi.js'];
    const env = process.env;
    env.API_TOKEN = this.apiToken;
    env.PORT = this.port;
    env.HTTP_REPO_URI = this.httpRepoUri;
    env.MONGODB_URI = this.mongodb_uri;
    env.PYTHON_SCRIPTS_FILEPATH = this.pythonScriptsFilepath;
    const options = {
      cwd: path.resolve(__dirname, './../../'),
      env: env
    };
    const cp = spawn(command, args, options);
    cp.stdout.on('data', data => console.log(data.toString()));
    cp.stderr.on('data', data => {
      console.log(data.toString());
      throw new Error('Received unexpected data on stderr');
    });
    this.pServerStarted = (() => {
      return new Promise((resolve/*, reject*/) => {
        cp.stdout.on('data', data => {
          const matches = /port (\d+)/i.exec(data.toString());
          if (matches) {
            resolve(matches[1]);
          }
        });
      });
    })();
  });
  
  afterEach('close mongodb connection', function() {
    return this.mongoConnect()
      .then(db => db.close());
  });
  
  describe('endpoints', function() {
    
    it('GET /health/status contains data from build-metadata.json', function(done) {
      this.pServerStarted.then(() => {
        request.get({
          uri: `http://localhost:${this.port}/health/status`,
          json: true
        }, (err, res, body) => {
          expect(err).to.equal(null);
          expect(res.statusCode).to.equal(200);
          expect(body).to.be.an('object');
          expect(body).to.have.deep.property('build-metadata', this.buildMetadata);
          done();
        });
      });
    });
    
    it('POST /sensor-action is acknowledged', function(done) {
      this.pServerStarted.then(() => {
        request.post({
          uri: `http://localhost:${this.port}/sensor-action`,
          json: { action: 'capture-distance' },
          headers: {
            Authorization: `token ${this.apiToken}`
          }
        }, (err, res/*, body*/) => {
          expect(err).to.equal(null);
          expect(res.statusCode).to.equal(201);
          done();
        });
      });
    });
    
    it('POST /plugs/action power-on updates the plug state in the database', function(done) {
      const deviceId = '2345678098765345678909876545678909876567';
      this.pServerStarted.then(() => {
        request.post({
          uri: `http://localhost:${this.port}/plugs/action`,
          json: { action: 'power-on', parameters: [ deviceId ] },
          headers: {
            Authorization: `token ${this.apiToken}`
          }
        }, (err, res/*, body*/) => {
          expect(err).to.equal(null);
          expect(res.statusCode).to.equal(201);
          
          this.mongoConnect().then(db => db.collection('plug-state'))
            .then(col => col.find())
            .then(cursor => cursor.toArray())
            .then(arr => {
              const plugInfo = arr.find(item => item.deviceId === deviceId);
              expect(plugInfo).to.have.property('relayState', 1);
            })
            .then(done, done);
        });
      });
    });
  });
});