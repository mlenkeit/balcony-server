/*globals after,afterEach,before*/
'use strict';

var async = require('async');
var exec = require('child_process').exec;
var kill = require('tree-kill');
var spawn = require('child_process').spawn;

module.exports = function(cb) {
  var childProcesses = [];
  var origExec, origSpawn;

  before(function() {
    // wrap exec and spawn to automatically clean them up in afterEach
    origExec = exec;
    exec = function() {
      var res = origExec.apply(this, arguments);
      childProcesses.push(res);
      return res;
    };

    origSpawn = spawn;
    spawn = function() {
      var res = origSpawn.apply(null, arguments);
      childProcesses.push(res);
      return res;
    };

    cb(exec, spawn);
  });

  afterEach(function(done) {
    async.each(childProcesses, function(cp, cb) {
      var pid = cp.pid;
      kill(pid, 'SIGKILL', function(/*err*/) {
        cb();
      });
    }, done);
    childProcesses.length = 0;
  });

  after(function() {
    exec = origExec;
    spawn = origSpawn;
  });
};
