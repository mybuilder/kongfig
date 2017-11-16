consumer example
----------------

## Config file

```yaml
consumers:
  - username: "iphone-app"
    ensure: "present"
    acls:
      - group: "foo-group"
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

### add customer acls

```sh
$ curl -i -X POST -H "Content-Type: application/json" \
  --url http://localhost:8001/consumers/2b47ba9b-761a-492d-9a0c-000000000001/acls \
  --data '{"group":"foo-group"}'
```

```
HTTP 201 Created
```

```
{
  "group": "foo-group",
  "created_at": "___created_at___",
  "id": "2b47ba9b-761a-492d-9a0c-000000000003",
  "consumer_id": "2b47ba9b-761a-492d-9a0c-000000000001"
}
```