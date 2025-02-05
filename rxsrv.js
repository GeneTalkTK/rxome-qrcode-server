#!/usr/bin/env node

import express from 'express';

import * as FS from 'fs' ;
import { program } from 'commander';
import bodyParser from 'body-parser';

import * as coder from 'rxome-generator';

const server = express();

const qrApi = coder.API

const version = "1.0.1"
// const version = require('./package').version
// import * as pkg from './package.json' assert { type: 'json' };
// const version=pkg.default.version;

let port = 1607;
let apiId = '';
let apiKey = '';

function sendError( res, err ) {
  console.log( 'Error: ', err.message );
  const datastr = JSON.stringify({ status: 422, message: err.message })
  res.writeHead(422, {
    'Content-Type': 'application/json',
    'Content-Length': datastr.length
  });
  res.end( datastr );
}


/************************************************************************************
 * set up express.js
 ************************************************************************************/

server.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

server.use(bodyParser.json());

/************************************************************************************
 * express.js middleware, API entry points
 ************************************************************************************/

//------------------------------------------------------------------------------------
server.get('/', (req, res) => {
  res.send(`This is the FindMe2care QRcode generator API Version ${version} for lab id ${apiId} running on port ${port} with PID ${process.pid} connected to ${qrApi}\n`);
});


//------------------------------------------------------------------------------------
server.get('/demo', (req, res) => {
  res.download('./demo_data_full.json');
});


//------------------------------------------------------------------------------------
server.get('/key', async (req, res) => {
  const key = await coder.generateApiKeys();
  // TODO move buffer2base64 to coder.generateApiKeys
  res.send(`<p>Private key:<br />${coder.bufferToBase64(key.privateKey)}</p><p>Public Key:<br />${coder.bufferToBase64(key.publicKey)}</p>`);
});


//------------------------------------------------------------------------------------
server.post('/img', async (req, res) => {
  const qrData = req.body;
console.log( qrData )
  // set credentials:
  ('credentials' in qrData) || (qrData.credentials = {});
  qrData.credentials.keyId  ||= apiId;
  qrData.credentials.key    ||= apiKey;
  delete qrData.credentials.keyFile;

  // generate QR Code
  var result;
  try {
    result = await coder.makeQR( qrData, qrApi );
  }
  catch(err) {
    sendError( res, err );
    return;
  }

  const b64 = result.qr_code.split(",")[1];
  const imgData = Buffer.from(b64, 'base64');

  // send QR Code
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': imgData.length
  });

 res.end(imgData);
});


//------------------------------------------------------------------------------------
server.post('/check', async (req, res) => {
  const qrData = req.body;
  
  // set credentials:
  ('credentials' in qrData) || (qrData.credentials = {});
  qrData.credentials.keyId  ||= apiId;
  qrData.credentials.key    ||= apiKey;
  delete qrData.credentials.keyFile;
  
  const datastr = JSON.stringify( qrData );

  res.end( datastr );
});

//------------------------------------------------------------------------------------
server.post('/', async (req, res) => {
  const qrData = req.body;
  
  // set demo credentials:
  ('credentials' in qrData) || (qrData.credentials = {});
  qrData.credentials.keyId  ||= apiId;
  qrData.credentials.key    ||= apiKey;
  delete qrData.credentials.keyFile;

  // generate QR Code
  var result;
  try {
    result = await coder.makeQR( qrData, qrApi );
  }
  catch(err) {
    sendError( res, err );
    return;
  }

  const data = { 
    qr_code: result.qr_code,
    qr_content: result.qr_content,
    pseudonym: result.pseudonym
  }
  const datastr = JSON.stringify( data );

  // send QR Code
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Content-Length': datastr.length
  });

  res.end( datastr );
});


/************************************************************************************
 * use commander to parse command line
 ************************************************************************************/

program
  .name('rxsrv')
  .usage('usage: rxsrv -e | -c <cfg_file> | -i <id> (-k <key_file> | -s <key> | -K) [-p <port>]')
  .version('1.0.1')
  .description(
`Starts the QR-code tool as service listening on localhost:<port>.
Before first use, please use the -K option to generate an API access key and deposit the public key on the FindMe2care server.\n
Given multiple key options, -K has highest priority.\n
The command-line parameters -k, -s, -p precede the environment variables (if -e specified), which, in turn, precede the config file (if -c is also specified). 
A key string (-s) has precedence over a key from a key file (-k).\n
If no parameter is given, -e is assumed.
`)
  .addHelpText('beforeAll', 'FindMe2care QR-Code generation server\n')
  .addHelpText('afterAll', '\nAuthor: Tom Kamphans, GeneTalk GmbH, 2023')
  .option('-c, --config <filename>', 'JSON file with config, entries id, key, [port]; -c-- to read from stdin')
  .option('-e, --environment', 'use environment variables RXID, RXKEY, RXPORT to configure rxsrv (useful for working with docker)')
  .option('-i, --keyId <id>', 'API access ID')
  .option('-k, --keyFile <filename>', 'Filename with API access key (default: use -s)')
  .option('-s, --key <key string>', 'API access key')
  .option('-p, --port <port>', 'Set port for server, default: 1607')
  .option('-K, --newkey', 'Generate new key pair, print both keys and start the server with the new key pair')
  .action( async (options) => {
    console.log( "This is rxsrv startet with " );
    console.log( process.argv );
    if ( options.config ) {
      const cfg = JSON.parse( FS.readFileSync( options.config === '--' ? '/dev/stdin' : options.config ));
      apiId = cfg.id;
      apiKey = cfg.key;
      cfg.port && (port = +cfg.port);
    }

    if ( options.environment ) {
      process.env.RXID   && ( apiId  =  process.env.RXID   );
      process.env.RXKEY  && ( apiKey =  process.env.RXKEY  );
      process.env.RXPORT && ( port   = +process.env.RXPORT );
    }
    
    if ( options.keyFile ) {
      apiKey = FS.readFileSync( options.keyFile, 'ascii').slice(0,44)
    }

    options.keyId && ( apiId  =  options.keyId );
    options.key   && ( apiKey =  options.key   );
    options.port  && ( port   = +options.port  );

    if ( options.newkey ) {
      const key = await coder.generateApiKeys();
      // TODO move buffer2base64 to coder.generateApiKeys
      apiKey = coder.bufferToBase64(key.privateKey)
      process.stdout.write(`Private key:\n${apiKey}\n\nPublic Key:\n${coder.bufferToBase64(key.publicKey)}\n\n`);
      process.stdout.write('Please copy the public key into your FM2C profile and keep the private key in a safe place.\n\n');
    }

    if ( !apiId  ) {
      process.env.RXID  && ( apiId  =  process.env.RXID  );
    }

    if ( !apiKey ) {
      process.env.RXKEY && ( apiKey =  process.env.RXKEY );
    }

    if ( !apiId ) {
      console.log('Error: keyID must be given!');
      return 1;
    }

    if ( !apiKey ) {
      console.log('Error: either keyFile, key or -K must be given!');
      return 1;
    }

    server.listen(port, () => {
      console.log(`FindMe2care QR Code generator listening at http://localhost:${port} connected to ${qrApi} for user ${apiId}`);
      // console.log(`Key: ${apiKey}`)
    });
  })



program.parse();
