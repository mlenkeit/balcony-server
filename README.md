# Traffic Lights Server

> Server for dispatching the status of Cleware traffic lights

## Endpoints

### GET `/remote-control/:piSerialNumber`

Get (and remove) and commands for a Pi serial number.

Requires `Authorization: token <api_token>` header that matches the `api_token` environment variable.

Content type: `application/json`

Status codes:
- `200` (default)

Sample response (status code `200`):

```json
[
  {
    "piSerialNumber": "123",
    "command": "sudo shutdown"
  }
]
```

### POST `/remote-control`

Create a remote control command.

Requires `Authorization: token <api_token>` header that matches the `api_token` environment variable.

Status codes:
- `201` (default)

Sample request payload:

```json
{
  "piSerialNumber": "123",
  "command": "sudo shutdown"
}
```

### GET `/status`

Get all statuses.

Content type: `application/json`

Status codes:
- `200` (default)

Sample response (status code `200`):

```json
[
  {
    "deviceSerialNumber": "123",
    "status": "red"
  }
]
```

### PUT `/status/:deviceSerialNumber`

Update the status for a device serial number (serial number of traffic light).

Requires `Authorization: token <api_token>` header that matches the `api_token` environment variable.

Parameter `deviceSerialNumber` is validated against the `device_serial_number_whitelist` environment variable.

Valid statuses are `red`, `yellow`, `green`, `off`.

Status codes:
- `204` (default)
- `400` for invalid status in payload
- `404` for non-whitelisted device serial number

Sample request payload:

```json
{
  "status": "green" 
}
```

## Environment Variables

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `api_token` | `string` | *generated* | API token for changing data, logged to the console at start up with `info` |
| `device_serial_number_whitelist` | `[]` | error | Array of whitelisted serial numbers. |
| `log_level` | `string` | error | Minimum log level |
| `mongodb_service_name` | `string` | | the name of the MongoDB service (Cloud Foundry only) |
| `MONGODB_URI` | `string` | `mongodb://localhost:27017` | The uri of the Mongo DB (Heroku only) |
| `PORT` | `integer` | 3000 | Port for the web server |

## Deployment

### Deployment on Cloud Foundry

#### Preparation

```shell
# create MongoDB instance
$ cf create-service mongodb v3.0-container mongodb-traffic-lights
```

#### Configuration

```shell
$ cf set-env traffic-lights api_token <token>
$ cf set-env traffic-lights device_serial_number_whitelist '["<serial>"]'
```

#### Push to Cloud Foundry

```shell
$ cf push -n <unique-hostname>
```

### Deployment on Heroku

#### Preparation

```shell
# install heroku-cli for Mac
$ brew install heroku
# install heroki-cli for Windows
# https://devcenter.heroku.com/articles/heroku-cli#download-and-install-windows

# login
$ heroku login

# create url
$ heroku create ml-traffic-lights # creates https://ml-traffic-lights.herokuapp.com

# create MongoDB instance
$ heroku addons:create mongolab:sandbox
```

#### Configuration

```shell
$ heroku config:set api_token=<token> device_serial_number_whitelist='["<serial>"]'
$ heroku ps:restart
```

#### Push to Heroku

```shell
$ git push heroku master
```

## Utility

### Generate API Token

```shell
$ uuidgen
```

### Run MongoDB in Docker

```shell
$ docker pull mongo:latest
$ docker run -d -p 27017:27017 -p 28017:28017 -e MONGODB_DBNAME=trafficlights mongo
```

### cURL Commands

```shell
# GET /status
$ curl <DOMAIN>/status

# PUT /status/:deviceSerialNumber
$ curl -X PUT -H "Content-Type: application/json" -H "Authorization: token <token>" -d '{"status": "green"}' <DOMAIN>/status/<deviceSerialNumber>
```

