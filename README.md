# FindMe2Care (RxOME) QR-code generator service
Generates QR codes containing medical information for use with the FindMe2Care database
(formerly called RxOME). rxsrv start the QR generator as local service listening on localhost:*port* (default: port 1607).
A client can send POST requests to this port and retrieves the generated QR code by HTTP protocol.

**Right now, it works only with the test API**

## LICENSE

Copyright (c) 2023 MGZ-Tech GmbH

All rights reserved, unauthorized use prohibited.

## Prerequisites
Running the QR-Code server requires either `node.js` or `docker`.

## Starting the Server

For detailed descriptions see 
```
rxsrv --help
```

### Configure using Environment Variables

Start the server and read configuration from environment variables. Note that the env variables can be set in the 
environment's config file, e.g. when using Docker or NGINX. Setting the port is optional.

```
export RXID=rxome
export RXKEY=private_key_for_rxome
export RXPORT=4242

rxsrv -e
```

### Configure using Config File

Example config file (setting the port is optional.)

```
cat demo.cfg
{
  "id": "rxome",
  "key": "private_key_for_rxome",
  "port": "4242"
}

rxsrv -c demo.cfg
```

### Docker Image
Instead of installing node.js and starting the server manually, you can use a docker image to run the server, e.g. by

```
docker run -d -p 1607:1607 -e RXID="rxome" -e RXKEY='...private_key...' tomkamphans/rxsrv 
```

Note that the first port number in `-p 1607:1607` denotes the port on *localhost* to which the docker internal port (denoted the second port number, in this case 1607 also) is mapped. So if you need to run the service on another port, say 8081, use 
`docker run -p 8081:1607`.

Hint for Docker on Windows: set the start type of *Docker Desktop Service* to *automatic* using the Windows Services App (services.msc).


## API Endpoints

The server provides the following endpoints, see descriptions below:
- `GET /`
- `GET /demo`
- `POST /`
- `POST /img`

### Testing connection

Querying the url `localhost:<port>/` should yield a line such as 

```This is the RxOME QRcode generator API Version 0.0.1 for lab id rxome running on port 1607 with PID 26584```

### Getting Demo Data
For convenient testing, the server provides a demo JSON file by sending a GET request to `/data`.

### Getting a QR-Code in PNG
Send a JSON file with the data for the RxOME code generator by POST request to `/img`, e.g.

```
curl -X POST -H "Content-Type: application/json" -d @demo_data_full.json --output qrcode.png localhost:1607/
```

### Getting QR-Code and Pseudonym in JSON Format
In addition to the QR-Code itself, the code generator yields the pseudonym given to this patient. The laboratory may
use this pseudonym if the patient is re-evaluated and get a new QR-Code. Thus, the former medical data can be
overwritten in the FindMe2Care Database. For this, send the JSON file to `/`:

```
curl -X POST -H "Content-Type: application/json" -d @demo_data_full.json --output qrcode.json localhost:1607/
```

## Command-Line Tool

```
RxOME QR Code generation server

Usage: rxsrv usage: rxsrv -i <id> (-e | -c <cfg_file> | -k <key_file> | -s <key>) [-p <port>]

Start the QR-code tool as service listening on localhost:<port>.
Before first use, please generate an API access key with rxcode and deposit the public key on the
RxOME server.

The command-line parameters -k, -s, -p precede the environment variables (if -e specified), which, in
turn, precede the config file (if -c is also specified). A key string (-s) has precedence over a key
from a key file (-k).

Options:
  -c, --config <filename>   JSON file with config, entries id, key, [port]; -c-- to read from stdin
  -e, --environment         use environment variables RXID, RXKEY, RXPORT to configure rxsrv (useful
                            for working with docker)
  -i, --keyId <id>          API access ID
  -k, --keyFile <filename>  Filename with API access key (default: use -s)
  -s, --key <key string>    API access key
  -p, --port <port>         Set port for server, default: 1607
  -V, --version             output the version number
  -h, --help                display help
```


## Author
Tom Kamphans, GeneTalk GmbH
