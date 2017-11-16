global plugin example
---------------------

## Config file

```yaml
plugins:
  - name: cors
    attributes:
      config:
        credentials: false
        preflight_continue: false
        max_age: 7000

```

## Using curl

For illustrative purpose a cURL calls would be the following

### add global plugin

```sh
$ curl -i -X POST -H "Content-Type: application/json" \
  --url http://localhost:8001/plugins \
  --data '{"config":{"credentials":false,"preflight_continue":false,"max_age":7000},"name":"cors"}'
```

```
HTTP 201 Created
```

```
{
  "created_at": "___created_at___",
  "config": {
    "credentials": false,
    "max_age": 7000,
    "preflight_continue": false
  },
  "id": "2b47ba9b-761a-492d-9a0c-000000000001",
  "enabled": true,
  "name": "cors"
}
```