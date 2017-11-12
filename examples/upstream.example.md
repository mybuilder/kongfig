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
```

Please note that the port is required. If the port is not provided, then Kong will automatically provide a port using it's logic and your config will have a mismatch (see [details here](https://getkong.org/docs/latest/admin-api/#add-target)).

For more information regarding upstreams and targets in Kong, read their [load balancing reference](https://getkong.org/docs/latest/loadbalancing/).

## Using cURL

For illustrative purpose a cURL call would be the following

### create upstream

```bash
curl -X POST \
  http://localhost:8001/upstreams \
  -H 'content-type: application/json' \
  -d '{
	"name": "mockbinUpstream",
	"slots": 10
}'
```

```
HTTP 201 Created
```

```json
{
    "orderlist": [
        10,
        4,
        3,
        2,
        6,
        1,
        9,
        5,
        8,
        7
    ],
    "slots": 10,
    "id": "4afe745b-0ed9-4e17-82cd-5257f1ad2f1b",
    "name": "mockbinUpstream",
    "created_at": 1510849638942
}
```

### create first target

```bash
curl -X POST \
  http://localhost:8001/upstreams/mockbinUpstream/targets \
  -H 'content-type: application/json' \
  -d '{
	"target": "server1.mockbin:3001",
	"weight": 50
}'
```

```bash
HTTP 201 Created
```

```json
{
    "target": "server1.mockbin:3001",
    "id": "8899003f-79c4-48ee-906d-8d2692fd0b98",
    "weight": 50,
    "created_at": 1510849726293,
    "upstream_id": "4afe745b-0ed9-4e17-82cd-5257f1ad2f1b"
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
    "target": "server2.mockbin:3001",
    "id": "77149168-25c9-4d04-abb6-9dcb980bd523",
    "weight": 50,
    "created_at": 1510850271896,
    "upstream_id": "4afe745b-0ed9-4e17-82cd-5257f1ad2f1b"
}
```

Kong, by design, does not delete targets but keeps adding them. So, if there are two targets with a value of "server1.mockbin:3001", Kong chooses the most recently created one. If the most recent one has a weight of 0 (zero), then the target does not get used. To see the active targets, use the [active targets api](https://getkong.org/docs/latest/admin-api/#list-active-targets):

```bash
curl -X GET \
  http://localhost:8001/upstreams/mockbinUpstream/targets/active/
```

```bash
HTTP 200 OK
```

```json
{
    "data": [
        {
            "weight": 50,
            "id": "77149168-25c9-4d04-abb6-9dcb980bd523",
            "target": "server2.mockbin:3001",
            "created_at": 1510850271896,
            "upstream_id": "4afe745b-0ed9-4e17-82cd-5257f1ad2f1b"
        },
        {
            "weight": 50,
            "id": "8899003f-79c4-48ee-906d-8d2692fd0b98",
            "target": "server1.mockbin:3001",
            "created_at": 1510849726293,
            "upstream_id": "4afe745b-0ed9-4e17-82cd-5257f1ad2f1b"
        }
    ],
    "total": 2
}
```
