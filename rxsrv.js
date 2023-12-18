#!/usr/bin/env node --no-warnings

import express from 'express';

import * as FS from 'fs' ;
import { program } from 'commander';
import bodyParser from 'body-parser';

import * as coder from 'rxome-generator';

const server = express();

const qrApi = coder.API

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
  res.send(`This is the FindMe2care QRcode generator API Version ${version} for lab id ${apiId} running on port ${port} with PID ${process.pid} connected to ${qrApi}\n`);
});

server.get('/demo', (req, res) => {
  res.download('./demo_data_full.json');
});

server.post('/img', async (req, res) => {
  const qrData = req.body;
  
  // set demo credentials:
  // ('credentials' in qrData) || (qrData.credentials = {});
  // qrData.credentials.keyId = coder.DEMO_API_ID;
  // qrData.credentials.key = coder.DEMO_API_PRIVATE_KEY;
  // qrData.credentials.user = 'info@rxome.net';
  // delete qrData.credentials.keyFile;
  
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
  // ('credentials' in qrData) || (qrData.credentials = {});
  // qrData.credentials.keyId = coder.DEMO_API_ID;
  // qrData.credentials.key = coder.DEMO_API_PRIVATE_KEY;
  // qrData.credentials.user = 'info@rxome.net';
  // delete qrData.credentials.keyFile;
  
  // generate QR Code
  const result = await coder.makeQR( qrData, qrApi );
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

server.get('/key', async (req, res) => {
  const key = await coder.generateApiKeys();
  // TODO move buffer2base64 to coder.generateApiKeys
  res.send(`<p>Private key:<br />${coder.bufferToBase64(key.privateKey)}</p><p>Public Key:<br />${coder.bufferToBase64(key.publicKey)}</p>`);
});

/************************************************************************************
 * use commander to parse command line
 ************************************************************************************/

program
  .name('rxsrv')
  .usage('usage: rxsrv -i <id> (-e | -c <cfg_file> | -k <key_file> | -s <key>) [-p <port>] OR rxsrv --newkey')
  .description(
`Start the QR-code tool as service listening on localhost:<port>.
Before first use, please generate an API access key with rxcode and deposit the public key on the FindMe2care server.\n
The command-line parameters -k, -s, -p precede the environment variables (if -e specified), which, in turn, precede the config file (if -c is also specified). A key string (-s) has precedence over a key from a key file (-k).
`)
  .version('1.0.0')
  .addHelpText('beforeAll', 'FindMe2care QR-Code generation server\n')
  .addHelpText('afterAll', '\nAuthor: Tom Kamphans, GeneTalk GmbH, 2023')
  .option('-c, --config <filename>', 'JSON file with config, entries id, key, [port]; -c-- to read from stdin')
  .option('-e, --environment', 'use environment variables RXID, RXKEY, RXPORT to configure rxsrv (useful for working with docker)')
  .option('-i, --keyId <id>', 'API access ID')
  .option('-k, --keyFile <filename>', 'Filename with API access key (default: use -s)')
  .option('-s, --key <key string>', 'API access key')
  .option('-p, --port <port>', 'Set port for server, default: 1607')
  .option('-K, --newkey')
  .action( async (options) => {
    if ( options.newkey ) {
      const key = await coder.generateApiKeys();
      // TODO move buffer2base64 to coder.generateApiKeys
      console.log(`Private key:\n${coder.bufferToBase64(key.privateKey)}\n\nPublic Key:\n${coder.bufferToBase64(key.publicKey)}\n\n`);
      return 0;
    }
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
      apiKey = coder.readSigKey( options.keyFile );
    }

    options.keyId && ( apiId  =  options.keyId );
    options.key   && ( apiKey =  options.key   );
    options.port  && ( port   = +options.port  );

    if ( !apiId || !apiKey ) {
      console.log('Error: keyID and either keyFile or key must be given!');
      return 1;
    }

    server.listen(port, () => {
      console.log(`FindMe2care QR Code generator listening at http://localhost:${port} connected to ${qrApi}`);
    });
  })



program.parse();