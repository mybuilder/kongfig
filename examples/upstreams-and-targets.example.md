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
      healthchecks:
        active:
          unhealthy:
            http_statuses:
              - 404
            tcp_failures: 1
            timeouts: 1
            http_failures: 1
            interval: 1
          http_path: /health
          healthy:
            http_statuses:
              - 200
            interval: 1
            successes: 1
          timeout: 1
          concurrency: 1
        passive:
          unhealthy:
            http_failures: 1
            http_statuses:
              - 404
            tcp_failures: 1
            timeouts: 1
          healthy:
            successes: 1
            http_statuses:
              - 200

```

## Using curl

For illustrative purpose a cURL calls would be the following

### create upstream

```sh
$ curl -i -X POST -H "Content-Type: application/json" \
  --url http://localhost:8001/upstreams \
  --data '{"slots":10,"healthchecks":{"active":{"unhealthy":{"http_statuses":[404],"tcp_failures":1,"timeouts":1,"http_failures":1,"interval":1},"http_path":"/health","healthy":{"http_statuses":[200],"interval":1,"successes":1},"timeout":1,"concurrency":1},"passive":{"unhealthy":{"http_failures":1,"http_statuses":[404],"tcp_failures":1,"timeouts":1},"healthy":{"successes":1,"http_statuses":[200]}}},"name":"mockbinUpstream"}'
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
          404
        ],
        "tcp_failures": 1,
        "timeouts": 1,
        "http_failures": 1,
        "interval": 1
      },
      "http_path": "/health",
      "timeout": 1,
      "healthy": {
        "http_statuses": [
          200
        ],
        "interval": 1,
        "successes": 1
      },
      "concurrency": 1
    },
    "passive": {
      "unhealthy": {
        "http_failures": 1,
        "http_statuses": [
          404
        ],
        "tcp_failures": 1,
        "timeouts": 1
      },
      "healthy": {
        "http_statuses": [
          200
        ],
        "successes": 1
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

### update upstream

```sh

```

```
HTTP 200 OK
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
          404
        ],
        "tcp_failures": 1,
        "timeouts": 1,
        "http_failures": 1,
        "interval": 1
      },
      "http_path": "/health",
      "timeout": 1,
      "healthy": {
        "http_statuses": [
          200
        ],
        "interval": 1,
        "successes": 1
      },
      "concurrency": 1
    },
    "passive": {
      "unhealthy": {
        "http_failures": 1,
        "http_statuses": [
          404
        ],
        "tcp_failures": 1,
        "timeouts": 1
      },
      "healthy": {
        "http_statuses": [
          200
        ],
        "successes": 1
      }
    }
  },
  "name": "mockbinUpstream",
  "hash_fallback": "none",
  "slots": 10
}
```