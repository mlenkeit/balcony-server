'use strict';

const EventEmitter = require('events');
const sinon = require('sinon');

module.exports = function() {
  const events = new EventEmitter();
  const client = {};
  const pendingEvents = [];
  
  client.startDiscovery = sinon.spy(function() {
    process.nextTick(function() {
      pendingEvents.forEach(args => events.emit.apply(events, args));
      pendingEvents.length = 0;
    });
    return client;
  });
  client.stopDiscovery = sinon.spy();
  
  client.emit = function() {
    if (client.startDiscovery.called) {
      events.emit.apply(events, arguments);
    } else {
      pendingEvents.push(arguments);
    }
    return client;
  };
  client.on = function() {
    events.on.apply(events, arguments);
  };
  
  return client;
};