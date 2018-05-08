upstream example
------------------

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
              - 229
              - 204
              - 200
              - 201
              - 202
              - 203
              - 204
              - 205
            tcp_failures: 5
            timeouts: 4
            http_failures: 4
            interval: 5
          http_path: /health
          healthy:
            http_statuses:
              - 200
              - 302
              - 500
            interval: 3
            successes: 5
          timeout: 12
          concurrency: 12
        passive:
          unhealthy:
            http_failures: 4
            http_statuses:
              - 429
              - 500
              - 503
            tcp_failures: 4
            timeouts: 4
          healthy:
            successes: 4
            http_statuses:
              - 200
              - 201
              - 202
              - 203
              - 204
              - 205
              - 206
              - 207
              - 208
              - 226
              - 300
              - 301
              - 302
              - 303
              - 304
              - 305
              - 306
              - 307
              - 308      
```

Please note that the port is required. If the port is not provided, then Kong will automatically provide a port using it's logic and your config will have a mismatch (see [details here](https://getkong.org/docs/latest/admin-api/#add-target)).

For more information regarding upstreams and targets in Kong, read their [load balancing reference](https://getkong.org/docs/latest/loadbalancing/).

## Using cURL

For illustrative purpose a cURL call would be the following

### create upstream

```sh
$ curl -i -X POST -H "Content-Type: application/json" \
  --url http://localhost:8001/upstreams \
  --data '{"slots":10,"name":"mockbinUpstream"}'
```

```
HTTP 201 Created
```

```json
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

### create first target

```sh
$ curl -i -X POST -H "Content-Type: application/json" \
  --url http://localhost:8001/upstreams/2b47ba9b-761a-492d-9a0c-000000000001/targets \
  --data '{"weight":60,"target":"server1.mockbin:3001"}'
```

```bash
HTTP 201 Created
```

```json
{
  "created_at": "___created_at___",
  "weight": 50,
  "upstream_id": "2b47ba9b-761a-492d-9a0c-000000000001",
  "target": "server1.mockbin:3001",
  "id": "2b47ba9b-761a-492d-9a0c-000000000002"
}
```

### create second target

```bash
curl -X POST \
  http://localhost:8001/upstreams/mockbinUpstream/targets \
  -H 'content-type: application/json' \
  -d '{
	"target": "server2.mockbin:3001",
	"weight": 50
}'
```

```bash
HTTP 201 Created
```

```json
{
  "created_at": "___created_at___",
  "weight": 50,
  "upstream_id": "2b47ba9b-761a-492d-9a0c-000000000001",
  "target": "server2.mockbin:3001",
  "id": "2b47ba9b-761a-492d-9a0c-000000000003"
}
```

Kong, by design, does not delete targets but keeps adding them. So, if there are two targets with a value of "server1.mockbin:3001", Kong chooses the most recently created one. If the most recent one has a weight of 0 (zero), then the target does not get used. To see the active targets, use the [active targets api](https://getkong.org/docs/0.12.x/admin-api/#list-targets):

```bash
curl -X GET \
  http://localhost:8001/upstreams/mockbinUpstream/targets
```

```bash
HTTP 200 OK
```

```json
{
    "data": [
        {
            "created_at": "___created_at___",
            "id": "2b47ba9b-761a-492d-9a0c-000000000003",
            "upstream_id": "2b47ba9b-761a-492d-9a0c-000000000001",
            "target": "server2.mockbin:3001",
            "weight": 50
        },
        {
            "created_at": "___created_at___",
            "id": "a0c27d4f-3bcd-4c63-a666-29b491e99e48",
            "upstream_id": "2b47ba9b-761a-492d-9a0c-000000000001",
            "target": "server1.mockbin:3001",
            "weight": 50
        }
    ],
    "total": 2
}
```
