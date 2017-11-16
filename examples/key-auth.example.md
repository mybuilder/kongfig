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
  "created_at": "___created_at___",
  "username": "iphone-app",
  "id": "2b47ba9b-761a-492d-9a0c-000000000001"
}
```

### add customer credential

```sh
$ curl -i -X POST -H "Content-Type: application/json" \
  --url http://localhost:8001/consumers/2b47ba9b-761a-492d-9a0c-000000000001/key-auth \
  --data '{"key":"very-secret-key"}'
```

```
HTTP 201 Created
```

```
{
  "id": "2b47ba9b-761a-492d-9a0c-000000000002",
  "created_at": "___created_at___",
  "key": "very-secret-key",
  "consumer_id": "2b47ba9b-761a-492d-9a0c-000000000001"
}
```

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
  "created_at": "___created_at___",
  "strip_uri": true,
  "id": "2b47ba9b-761a-492d-9a0c-000000000003",
  "hosts": [
    "mockbin.com"
  ],
  "name": "mockbin",
  "http_if_terminated": false,
  "preserve_host": false,
  "upstream_url": "http://mockbin.com",
  "upstream_connect_timeout": 60000,
  "upstream_send_timeout": 60000,
  "upstream_read_timeout": 60000,
  "retries": 5,
  "https_only": false
}
```

### add api plugin

```sh
$ curl -i -X POST -H "Content-Type: application/json" \
  --url http://localhost:8001/apis/2b47ba9b-761a-492d-9a0c-000000000003/plugins \
  --data '{"config":{"key_names":["very-secret-key"]},"name":"key-auth"}'
```

```
HTTP 201 Created
```

```
{
  "created_at": "___created_at___",
  "config": {
    "key_names": [
      "very-secret-key"
    ],
    "key_in_body": false,
    "anonymous": "",
    "run_on_preflight": true,
    "hide_credentials": false
  },
  "id": "2b47ba9b-761a-492d-9a0c-000000000004",
  "name": "key-auth",
  "api_id": "2b47ba9b-761a-492d-9a0c-000000000003",
  "enabled": true
}
```