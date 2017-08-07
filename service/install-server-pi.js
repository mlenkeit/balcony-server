'use strict';

const assert = require('assert');
const execSync = require('child_process').execSync;

const API_TOKEN = process.env.API_TOKEN;
assert(API_TOKEN, 'missing env var API_TOKEN');
const PLUG_DEVICE_ID_PUMP = process.env.PLUG_DEVICE_ID_PUMP;
assert(PLUG_DEVICE_ID_PUMP, 'missing env var PLUG_DEVICE_ID_PUMP');
const PLUG_DEVICE_ID_TOMATOES = process.env.PLUG_DEVICE_ID_TOMATOES;
assert(PLUG_DEVICE_ID_TOMATOES, 'missing env var PLUG_DEVICE_ID_TOMATOES');
const PLUG_DEVICE_ID_BALCONY = process.env.PLUG_DEVICE_ID_BALCONY;
assert(PLUG_DEVICE_ID_BALCONY, 'missing env var PLUG_DEVICE_ID_BALCONY');

const whichNodeBuf = execSync('which node');
const whichNode = whichNodeBuf ? whichNodeBuf.toString() : null;
assert(whichNode, 'node must be installed');
const whichForeverBuf = execSync('which forever');
const whichForever = whichForeverBuf ? whichForeverBuf.toString() : null;
assert(whichForever, 'forever must be installed');

const service = `#!/bin/sh
#/etc/init.d/server-pi

case "$1" in
  start)
    export API_TOKEN=${API_TOKEN}
    export PLUG_DEVICE_ID_PUMP=${PLUG_DEVICE_ID_PUMP}
    export PLUG_DEVICE_ID_TOMATOES=${PLUG_DEVICE_ID_TOMATOES} 
    export PLUG_DEVICE_ID_BALCONY=${PLUG_DEVICE_ID_BALCONY}
    exec ${whichForever} start -p ${process.env.HOME}/.forever -c ${whichNode} ${process.env.PWD}/server-pi.js
    ;;
  stop)
    exec ${whichForever} stop -c ${whichNode} ${process.env.PWD}/server-pi.js
    ;;
  restart)
    export API_TOKEN=${API_TOKEN}
    export PLUG_DEVICE_ID_PUMP=${PLUG_DEVICE_ID_PUMP}
    export PLUG_DEVICE_ID_TOMATOES=${PLUG_DEVICE_ID_TOMATOES} 
    export PLUG_DEVICE_ID_BALCONY=${PLUG_DEVICE_ID_BALCONY}
    exec ${whichForever} restart -c ${whichNode} ${process.env.PWD}/server-pi.js
    ;;
  *)
    echo "Wrong parameters"
    exit 1
    ;;
esac
exit 0;
`;

console.log(service);