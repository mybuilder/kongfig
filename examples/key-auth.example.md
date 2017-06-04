key auth example
----------------

## Config file

```yaml
apis:
  - name: "mockbin"
    ensure: "present"
    attributes:
      upstream_url: "http://mockbin.com"
      hosts:
          - "mockbin.com"
    plugins:
      - name: "key-auth"
        attributes:
          config:
            key_names:
              - very-secret-key

consumers:
  - username: "iphone-app"
    ensure: "present"
    credentials:
      - name: "key-auth"
        ensure: "present"
        attributes:
          key: "very-secret-key"

```

## Using curl

For illustrative purpose a cURL calls would be the following

### create api

```sh
$ curl -i -X POST -H "Content-Type: application/json" \
  --url http://localhost:8001/apis \
  --data '{"upstream_url":"http://mockbin.com","hosts":["mockbin.com"],"name":"mockbin"}'
```

```
HTTP 201 Created
```

```
{
  "http_if_terminated": true,
  "id": "2b47ba9b-761a-492d-9a0c-000000000001",
  "retries": 5,
  "preserve_host": false,
  "created_at": "___created_at___",
  "upstream_connect_timeout": 60000,
  "upstream_url": "http://mockbin.com",
  "upstream_read_timeout": 60000,
  "https_only": false,
  "upstream_send_timeout": 60000,
  "strip_uri": true,
  "name": "mockbin",
  "hosts": [
    "mockbin.com"
  ]
}
```

### add api plugin

```sh
$ curl -i -X POST -H "Content-Type: application/json" \
  --url http://localhost:8001/apis/2b47ba9b-761a-492d-9a0c-000000000002/plugins \
  --data '{"config":{"key_names":["very-secret-key"]},"name":"key-auth"}'
```

```
HTTP 201 Created
```

```
{
  "api_id": "2b47ba9b-761a-492d-9a0c-000000000002",
  "id": "2b47ba9b-761a-492d-9a0c-000000000002",
  "created_at": "___created_at___",
  "enabled": true,
  "name": "key-auth",
  "config": {
    "hide_credentials": false,
    "anonymous": "",
    "key_names": [
      "very-secret-key"
    ],
    "key_in_body": false
  }
}
```

### create customer

```sh
$ curl -i -X POST -H "Content-Type: application/json" \
  --url http://localhost:8001/consumers \
  --data '{"username":"iphone-app"}'
```

```
HTTP 201 Created
```

```
{
  "username": "iphone-app",
  "created_at": "___created_at___",
  "id": "2b47ba9b-761a-492d-9a0c-000000000003"
}
```

### add customer credential

```sh
$ curl -i -X POST -H "Content-Type: application/json" \
  --url http://localhost:8001/consumers/2b47ba9b-761a-492d-9a0c-000000000004/key-auth \
  --data '{"key":"very-secret-key"}'
```

```
HTTP 201 Created
```

```
{
  "created_at": "___created_at___",
  "consumer_id": "2b47ba9b-761a-492d-9a0c-000000000004",
  "key": "very-secret-key",
  "id": "2b47ba9b-761a-492d-9a0c-000000000004"
}
```