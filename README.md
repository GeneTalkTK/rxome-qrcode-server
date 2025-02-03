# FindMe2Care QR-code generator service
Generates QR codes containing medical information for use with the FindMe2Care database
(formerly called RxOME). The command line tool `rxsrv` starts the QR generator as local service listening on localhost:*port* (default: port 1607).
A client can send POST requests to this port and retrieves the generated QR code by HTTP protocol.

A second package, rxome-server-win, build up on rxome-server installs the server as windows service.


## LICENSE

Copyright (c) 2023 RxOME GmbH

All rights reserved, unauthorized use prohibited.

## Prerequisites
Running the QR-Code server requires either `node.js` or `docker`.

## Using Node.js 

### Installation
Either install the QR-Code Server or the Windows service installer using

```
npm install -q rxome-server 
```

or

```
npm install -q rxome-server-win
```


### Starting the QR-Code Server

For detailed descriptions see 
```
rxsrv --help
```

### Generating API access keys
You can generate new API access keys using the command line:
```
rxsrv --newkey
```

or in the Windows version: 
```
rxsrv_win.cmd command
```

or start the server with dummy FindMe2Care credentials and access the '/key' entrypoint of the server.

### Configuring using Environment Variables

The following command starts the server and reads the configuration from environment variables. 
Note that the env variables can be set in the 
environment's config file, e.g. when using Docker or NGINX. Setting the port is optional.

```
export RXID=rxome
export RXKEY=private_key_for_rxome
export RXPORT=4242

rxsrv -e
```

Where `RXID` is the username of the laboratory on the FindMe2Care platform, `RXKEY` is the 
private API access key matching the public key stored on the lab's profile on the 
FindMe2Care platform. See the README of the rxome-qrcode-generator for generating the
API keys.

Note that storing secret information in environment variables may pose a security risk; therefore, this option is not recommended and should only be used if the software runs in an isolated environment.

### Configuring using Config File

Example config file (setting the port is optional.)

```
cat demo.cfg
{
  "id": "rxome",
  "key": "private_key_for_rxome",
  "port": "4242"
}
```

Start the server and read settings from config file:

```
rxsrv -c demo.cfg
```


### Registering and Unregistering the Windows Service
The npm package `rxome-server-win` provides a Windows executable that you can start with:

```
rxsrv_win.cmd command
```

where command is one of

- install
- uninstall
- ping
- newkey
- help 

Note that the Windows service is configured with a config file given by `%RXCFG%` or, if none specified, 
the default file `%APPDATA\npm\node_modules\rxome-server-win\demo.cfg` is used.

## Using Docker
Instead of installing node.js and starting the server manually, you can use a docker image to run the server, e.g. by

```
docker run -d -p 1607:1607 -e RXID="rxome" -e RXKEY="...private_key..." tomkamphans/rxsrv 
```

Where `RXID` is the lab's user name and `RXKEY` the private API key as described above.

Note that the first port number in `-p 1607:1607` denotes the port on *localhost* to which the docker internal port (denoted the second port number, in this case 1607 also) is mapped. So if you need to run the service on another port, say 8081, use 
`docker run -p 8081:1607 ...`.

Hint for Docker on Windows: set the start type of *Docker Desktop Service* to *automatic* using the Windows Services App (services.msc).


## API Endpoints

The server provides the following endpoints, see descriptions below:

* `GET /`
* `GET /demo`
* `POST /`
* `POST /img`
* `GET /key`

### Testing connection

Querying the url `localhost:<port>/` should yield a line such as 

```This is the RxOME QRcode generator API Version 0.0.1 for lab id rxome running on port 1607 with PID 26584```

### Getting Demo Data
For convenient testing, the server provides a demo JSON file by sending a GET request to `/data`.

### Getting a QR-Code in PNG
Send a JSON file with the data for the RxOME code generator by POST request to `/img`, e.g.

```
curl -X POST -H "Content-Type: application/json" -d @demo_data_full.json --output qrcode.png localhost:1607/img
```

### Getting QR-Code and Pseudonym in JSON Format
In addition to the QR-Code itself, the code generator yields the pseudonym given to this patient
and the full unencrypted content of the QR code. The laboratory may
use this pseudonym if the patient is re-evaluated and gets a new QR-Code. Thus, the former medical data can be
overwritten in the FindMe2Care Database. To get the QR-code and the pseudonyme in JSON format, send the input JSON file to `/`:

```
curl -X POST -H "Content-Type: application/json" -d @demo_data_full.json --output qrcode.json localhost:1607/
```

This yields a JSON response containing 

```
{
    qr_code: (QR code),
    pseudonym: (pseudonym used to generate the QR code),
    qr_content: content of the QR code but with unencrypted medical data for documentation purposes
}
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
