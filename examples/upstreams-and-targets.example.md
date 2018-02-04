upstreams and targets example
-----------------------------

## Config file

```yaml
upstreams:
  - name: "mockbinUpstream"
    ensure: "present"
    targets:
      - target: "server1.mockbin:3001"
        attributes:
          weight: 50
      - target: "server2.mockbin:3001"
        attributes:
          weight: 50
    attributes:
      slots: 10

```

## Using curl

For illustrative purpose a cURL calls would be the following

### create upstream

```sh
$ curl -i -X POST -H "Content-Type: application/json" \
  --url http://localhost:8001/upstreams \
  --data '{"slots":10,"name":"mockbinUpstream"}'
```

```
HTTP 201 Created
```

```
{
  "created_at": "___created_at___",
  "hash_on": "none",
  "id": "2b47ba9b-761a-492d-9a0c-000000000001",
  "healthchecks": {
    "active": {
      "unhealthy": {
        "http_statuses": [
          429,
          404,
          500,
          501,
          502,
          503,
          504,
          505
        ],
        "tcp_failures": 0,
        "timeouts": 0,
        "http_failures": 0,
        "interval": 0
      },
      "http_path": "/",
      "healthy": {
        "http_statuses": [
          200,
          302
        ],
        "interval": 0,
        "successes": 0
      },
      "timeout": 1,
      "concurrency": 10
    },
    "passive": {
      "unhealthy": {
        "http_failures": 0,
        "http_statuses": [
          429,
          500,
          503
        ],
        "tcp_failures": 0,
        "timeouts": 0
      },
      "healthy": {
        "successes": 0,
        "http_statuses": [
          200,
          201,
          202,
          203,
          204,
          205,
          206,
          207,
          208,
          226,
          300,
          301,
          302,
          303,
          304,
          305,
          306,
          307,
          308
        ]
      }
    }
  },
  "name": "mockbinUpstream",
  "hash_fallback": "none",
  "slots": 10
}
```

### add upstream target

```sh
$ curl -i -X POST -H "Content-Type: application/json" \
  --url http://localhost:8001/upstreams/2b47ba9b-761a-492d-9a0c-000000000001/targets \
  --data '{"weight":50,"target":"server1.mockbin:3001"}'
```

```
HTTP 201 Created
```

```
{
  "created_at": "___created_at___",
  "weight": 50,
  "upstream_id": "2b47ba9b-761a-492d-9a0c-000000000001",
  "target": "server1.mockbin:3001",
  "id": "2b47ba9b-761a-492d-9a0c-000000000002"
}
```

### add upstream target

```sh
$ curl -i -X POST -H "Content-Type: application/json" \
  --url http://localhost:8001/upstreams/2b47ba9b-761a-492d-9a0c-000000000001/targets \
  --data '{"weight":50,"target":"server2.mockbin:3001"}'
```

```
HTTP 201 Created
```

```
{
  "created_at": "___created_at___",
  "weight": 50,
  "upstream_id": "2b47ba9b-761a-492d-9a0c-000000000001",
  "target": "server2.mockbin:3001",
  "id": "2b47ba9b-761a-492d-9a0c-000000000003"
}
```