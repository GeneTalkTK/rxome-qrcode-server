#!/usr/bin/env node

import os from 'os';
if ( os.platform().indexOf('win32') < 0) {
  throw 'rxsrv_win is supported on Windows only.';
}


//var Service = require('node-windows').Service;
import Provider from 'node-windows';
import Path from 'path';

const rxDir = "C:\\Users\\Tom\\AppData\\Roaming\\npm\\node_modules\\rxome-server"
const cfg_file = process.env.RXCFG || Path.join( rxDir, "demo.cfg" );


const args = process.argv;
const cmd = ( args[0].match("node") ? args[2] : args[1] );


function usage() {
  console.log(`
  Utility to install and uninstall the RxOME QR-code generator as windows service.
  usage: rxsrv_win install | uninstall | ping | help
  `)
}

// Create a new service object
var svc = new Provider.Service({
  name: 'RxOME Server',
  description: 'Runs the rxome QR coder server as windows service',
  script: `${process.env.APPDATA}\\npm\\node_modules\\rxome-server\\rxsrv.js`,
  scriptOptions: `-c ${cfg_file}`,
  workingDirectory: rxDir,
  logpath: rxDir
  //, allowServiceLogon: true
});

switch (cmd) {
  case "help":
  case "-h":
  case "--help":
    usage();
    break;

  case "install":
    console.log( `Adding service rxome-server with config ${cfg_file}` );
    // Listen for the "install" event, which indicates the process is available as a service
    svc.on('install',function(){
      try {
        svc.start();
      }
      catch (error) {
        log.error( error );
        throw error ;
      }
    });

    try {
      svc.install();
    }
    catch (error) {
      log.error( error );
      throw error ;
    }
    break;

  case "uninstall":
    // Listen for the "uninstall" event so we know when it's done.
    svc.on('uninstall',function(){
      console.log('Uninstall complete.');
      console.log('The service', (svc.exists ? 'exists.' : 'does not exist.'));
    });

    // Uninstall the service.
    svc.uninstall();
    break;

  case "ping":
    console.log('The service', (svc.exists ? 'exists.' : 'does not exist.'));
    break;
}
