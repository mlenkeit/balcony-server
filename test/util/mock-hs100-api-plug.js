'use strict';

const EventEmitter = require('events');
const sinon = require('sinon');

module.exports = function(options) {
  options = options || {};
  options.deviceId = options.deviceId || '2345678098765345678909876545678909876567';
  
  const plug = new EventEmitter();
  
  const info = { sysInfo: 
   { err_code: 0,
     sw_ver: '1.1.3 Build 170608 Rel.204734',
     hw_ver: '1.0',
     type: 'IOT.SMARTPLUGSWITCH',
     model: 'HS100(EU)',
     mac: '11:22:33:44:55:66',
     deviceId: options.deviceId,
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
     longitude: 8.690409 } };
  
  plug.getInfo = sinon.stub().resolves(info);
  plug.setPowerState = sinon.stub().resolves();
  plug._info = info;
  plug._setSysInfoProp = (prop, val) => info.sysInfo[prop] = val;
  
  return plug;
};