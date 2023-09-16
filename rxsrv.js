#!/usr/bin/env node

import express from 'express';

import * as FS from 'fs' ;
import { program } from 'commander';
import bodyParser from 'body-parser';

import * as coder from 'rxome-generator';

const server = express();

const qrApi = coder.TESTAPI

// const version = require('./package').version
import * as pkg from './package.json' assert { type: 'json' };
const version=pkg.default.version;

let port = 1607;
let apiId = '';
let apiKey = '';

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

server.get('/', (req, res) => {
  res.send(`This is the RxOME QRcode generator API Version ${version} for lab id ${apiId} running on port ${port} with PID ${process.pid}\n`);
});

server.get('/demo', (req, res) => {
  res.download('./demo_data_full.json');
});

server.post('/img', async (req, res) => {
  const qrData = req.body;
  
  // set demo credentials:
  ('credentials' in qrData) || (qrData.credentials = {});
  qrData.credentials.keyId = coder.DEMO_API_ID;
  qrData.credentials.key = coder.DEMO_API_PRIVATE_KEY;
  qrData.credentials.user = 'info@rxome.net';
  delete qrData.credentials.keyFile;
  
  // generate QR Code
  const result = await coder.makeQR( qrData, qrApi );

  const b64 = result.qr_code.split(",")[1];
  const imgData = Buffer.from(b64, 'base64');

  // send QR Code
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': imgData.length
  });

 res.end(imgData);
});

server.post('/', async (req, res) => {
  const qrData = req.body;
  
  // set demo credentials:
  ('credentials' in qrData) || (qrData.credentials = {});
  qrData.credentials.keyId = coder.DEMO_API_ID;
  qrData.credentials.key = coder.DEMO_API_PRIVATE_KEY;
  qrData.credentials.user = 'info@rxome.net';
  delete qrData.credentials.keyFile;
  
  // generate QR Code
  const result = await coder.makeQR( qrData, qrApi );
  const data = { 
    qr_code: result.qr_code,
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
  .usage('usage: rxsrv -i <id> (-e | -c <cfg_file> | -k <key_file> | -s <key>) [-p <port>]')
  .description(
`Start the QR-code tool as service listening on localhost:<port>.
Before first use, please generate an API access key with rxcode and deposit the public key on the RxOME server.\n
The command-line parameters -k, -s, -p precede the environment variables (if -e specified), which, in turn, precede the config file (if -c is also specified). A key string (-s) has precedence over a key from a key file (-k).
`)
  .version('1.0.0')
  .addHelpText('beforeAll', 'RxOME QR-Code generation server\n')
  .addHelpText('afterAll', '\nAuthor: Tom Kamphans, GeneTalk GmbH, 2023')
  .option('-c, --config <filename>', 'JSON file with config, entries id, key, [port]; -c-- to read from stdin')
  .option('-e, --environment', 'use environment variables RXID, RXKEY, RXPORT to configure rxsrv (useful for working with docker)')
  .option('-i, --keyId <id>', 'API access ID')
  .option('-k, --keyFile <filename>', 'Filename with API access key (default: use -s)')
  .option('-s, --key <key string>', 'API access key')
  .option('-p, --port <port>', 'Set port for server, default: 1607')
  .action( (options) => {
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
      apiKey = RxAPI.readSigKey( options.keyFile );
    }

    options.keyId && ( apiId  =  options.keyId );
    options.key   && ( apiKey =  options.key   );
    options.port  && ( port   = +options.port  );

    if ( !apiId || !apiKey ) {
      console.log('Error: keyID and either keyFile or key must be given!');
      return 1;
    }

    server.listen(port, () => {
      console.log(`RxOME QR Code generator listening at http://localhost:${port}`);
    });
  })



program.parse();