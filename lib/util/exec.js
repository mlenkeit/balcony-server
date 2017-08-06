'use strict';

const exec = require('child_process').exec;

module.exports = function(command, options) {
  options = options || {};
  return new Promise((resolve, reject) => {
    // console.log('command', command);
    // console.log('options', options);
    // console.log(process.env.PATH);
    exec(command, options, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(stdout.toString());
    });
  });
};