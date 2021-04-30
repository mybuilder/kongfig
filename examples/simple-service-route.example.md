simple service route example
----------------------------

## Config file

```yaml
services:
- name: "mockbin"
  ensure: "present"
  attributes:
    url: "http://mockbin.com"
  routes:
  - name: r1
    attributes:
      hosts:
      - 'mockbin.com'

```

## Using curl

For illustrative purpose a cURL calls would be the following

### create service

```sh
$ curl -i -X POST -H "Content-Type: application/json" \
  --url http://localhost:8001/services \
  --data '{"url":"http://mockbin.com","name":"mockbin"}'
```

```
HTTP 201 Created
```

```
{
  "host": "mockbin.com",
  "created_at": "___created_at___",
  "connect_timeout": 60000,
  "id": "2b47ba9b-761a-492d-9a0c-000000000001",
  "protocol": "http",
  "name": "mockbin",
  "read_timeout": 60000,
  "port": 80,
  "path": null,
  "updated_at": "___updated_at___",
  "retries": 5,
  "write_timeout": 60000
}
```

### add route

```sh

```

```
HTTP 200 OK
```

```
{
  "created_at": "___created_at___",
  "strip_path": true,
  "hosts": [
    "mockbin.com"
  ],
  "preserve_host": false,
  "regex_priority": 0,
  "updated_at": "___updated_at___",
  "paths": null,
  "service": {
    "id": "2b47ba9b-761a-492d-9a0c-000000000001"
  },
  "methods": null,
  "protocols": [
    "http",
    "https"
  ],
  "id": "7c92cf1e-ee8d-39cc-85f8-355a3d6e4b86"
}
```

### update service

```sh

```

```
HTTP 200 OK
```

```
{
  "host": "mockbin.com",
  "created_at": "___created_at___",
  "connect_timeout": 60000,
  "id": "2b47ba9b-761a-492d-9a0c-000000000001",
  "protocol": "http",
  "name": "mockbin",
  "read_timeout": 60000,
  "port": 80,
  "path": null,
  "updated_at": "___updated_at___",
  "retries": 5,
  "write_timeout": 60000
}
```

### update route

```sh

```

```
HTTP 200 OK
```

```
{
  "created_at": "___created_at___",
  "strip_path": true,
  "hosts": [
    "mockbin.com"
  ],
  "preserve_host": false,
  "regex_priority": 0,
  "updated_at": "___updated_at___",
  "paths": null,
  "service": {
    "id": "2b47ba9b-761a-492d-9a0c-000000000001"
  },
  "methods": null,
  "protocols": [
    "http",
    "https"
  ],
  "id": "7c92cf1e-ee8d-39cc-85f8-355a3d6e4b86"
}
```