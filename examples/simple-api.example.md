simple api example
------------------

## Config file

```yaml
apis:
  - name: "mockbin"
    ensure: "present"
    attributes:
      upstream_url: "http://mockbin.com"
      hosts:
          - "mockbin.com"

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