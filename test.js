const exec = require('child_process').exec;

exec('python vl53l0x-short-output.py', {
  cwd: '/Users/d053370/Workspaces/github/balcony-server/test/fixture',
  env: process.env
}, function(err, stdout, stderr) {
  console.log('err', err);
});