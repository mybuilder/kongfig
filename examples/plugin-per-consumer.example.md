plugin per consumer example
---------------------------

## Config file

```yaml
consumers:
  - username: user-john

apis:
  - name: mockbin-foo
    attributes:
      upstream_url: http://mockbin.com
      uris:
        - /foo
    plugins:
      - name: rate-limiting
        ensure: "present"
        attributes:
          username: user-john
          config:
            second: 10

  - name: mockbin-bar
    attributes:
      upstream_url: http://mockbin.com
      uris:
        - /bar

plugins:
  - name: rate-limiting
    attributes:
      username: user-john
      enabled: true
      config:
        minute: 60

  - name: rate-limiting
    attributes:
      enabled: true
      config:
        minute: 30

```

## Using curl

For illustrative purpose a cURL calls would be the following

### create customer

```sh
$ curl -i -X POST -H "Content-Type: application/json" \
  --url http://localhost:8001/consumers \
  --data '{"username":"user-john"}'
```

```
HTTP 201 Created
```

```
{
  "created_at": "___created_at___",
  "username": "user-john",
  "id": "2b47ba9b-761a-492d-9a0c-000000000001"
}
```

### create api

```sh
$ curl -i -X POST -H "Content-Type: application/json" \
  --url http://localhost:8001/apis \
  --data '{"upstream_url":"http://mockbin.com","uris":["/foo"],"name":"mockbin-foo"}'
```

```
HTTP 201 Created
```

```
{
  "created_at": "___created_at___",
  "strip_uri": true,
  "id": "2b47ba9b-761a-492d-9a0c-000000000002",
  "name": "mockbin-foo",
  "http_if_terminated": false,
  "preserve_host": false,
  "upstream_url": "http://mockbin.com",
  "uris": [
    "/foo"
  ],
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
  --url http://localhost:8001/apis/2b47ba9b-761a-492d-9a0c-000000000002/plugins \
  --data '{"consumer_id":"2b47ba9b-761a-492d-9a0c-000000000001","config":{"second":10},"name":"rate-limiting"}'
```

```
HTTP 201 Created
```

```
{
  "created_at": "___created_at___",
  "config": {
    "second": 10,
    "redis_database": 0,
    "policy": "cluster",
    "hide_client_headers": false,
    "redis_timeout": 2000,
    "redis_port": 6379,
    "limit_by": "consumer",
    "fault_tolerant": true
  },
  "id": "2b47ba9b-761a-492d-9a0c-000000000003",
  "enabled": true,
  "name": "rate-limiting",
  "api_id": "2b47ba9b-761a-492d-9a0c-000000000002",
  "consumer_id": "2b47ba9b-761a-492d-9a0c-000000000001"
}
```

### create api

```sh
$ curl -i -X POST -H "Content-Type: application/json" \
  --url http://localhost:8001/apis \
  --data '{"upstream_url":"http://mockbin.com","uris":["/bar"],"name":"mockbin-bar"}'
```

```
HTTP 201 Created
```

```
{
  "created_at": "___created_at___",
  "strip_uri": true,
  "id": "2b47ba9b-761a-492d-9a0c-000000000004",
  "name": "mockbin-bar",
  "http_if_terminated": false,
  "preserve_host": false,
  "upstream_url": "http://mockbin.com",
  "uris": [
    "/bar"
  ],
  "upstream_connect_timeout": 60000,
  "upstream_send_timeout": 60000,
  "upstream_read_timeout": 60000,
  "retries": 5,
  "https_only": false
}
```

### add global plugin

```sh
$ curl -i -X POST -H "Content-Type: application/json" \
  --url http://localhost:8001/plugins \
  --data '{"consumer_id":"2b47ba9b-761a-492d-9a0c-000000000001","enabled":true,"config":{"minute":60},"name":"rate-limiting"}'
```

```
HTTP 201 Created
```

```
{
  "created_at": "___created_at___",
  "config": {
    "hide_client_headers": false,
    "minute": 60,
    "policy": "cluster",
    "redis_database": 0,
    "redis_timeout": 2000,
    "redis_port": 6379,
    "limit_by": "consumer",
    "fault_tolerant": true
  },
  "id": "2b47ba9b-761a-492d-9a0c-000000000005",
  "name": "rate-limiting",
  "enabled": true,
  "consumer_id": "2b47ba9b-761a-492d-9a0c-000000000001"
}
```

### add global plugin

```sh
$ curl -i -X POST -H "Content-Type: application/json" \
  --url http://localhost:8001/plugins \
  --data '{"enabled":true,"config":{"minute":30},"name":"rate-limiting"}'
```

```
HTTP 201 Created
```

```
{
  "created_at": "___created_at___",
  "config": {
    "hide_client_headers": false,
    "minute": 30,
    "policy": "cluster",
    "redis_database": 0,
    "redis_timeout": 2000,
    "redis_port": 6379,
    "limit_by": "consumer",
    "fault_tolerant": true
  },
  "id": "2b47ba9b-761a-492d-9a0c-000000000006",
  "enabled": true,
  "name": "rate-limiting"
}
```