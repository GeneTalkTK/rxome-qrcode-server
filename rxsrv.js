const express = require('express');
const coder = require('./node_modules/rxome-generator/lib/rxome-generator');
const RxAPI = require( './node_modules/rxome-generator/lib/rxome-api' );
const RxAPIDemo = require( './node_modules/rxome-generator/lib/rxome-api-demo' );
const bodyParser = require('body-parser');

const app = express();

const qrApi = RxAPI.TESTAPI

const port = 3000;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('This is the RxOME Qrcode generator API');
});

app.post('/qrcode', async (req, res) => {
  const qrData = req.body;
  
  // set demo credentials:
  ('credentials' in qrData) || (qrData.credentials = {});
  qrData.credentials.keyId = RxAPIDemo.DEMO_API_ID;
  qrData.credentials.key = RxAPIDemo.DEMO_API_PRIVATE_KEY;
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


app.listen(port, () => {
  console.log(`RxOME QR Code generator listening at http://localhost:${port}`);
});