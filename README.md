<p align="center">
    <img src="logo.png">
</p>

# Kongfig

A tool for [Kong](https://getkong.org/) to allow declarative configuration.

Simply define your list of APIs and consumers in json and then run kongfig to ensure that your Kong is configured correctly.

[![Build Status](https://travis-ci.org/mybuilder/kongfig.svg?branch=master)](https://travis-ci.org/mybuilder/kongfig)

## Install

### Manually
We recommend installing Kongfig globally

```
npm install -g kongfig
```

### Puppet
Use our [Puppet-Kongfig](https://forge.puppetlabs.com/mybuilder/kongfig) module to install and configure Kongfig

```
puppet module install mybuilder-kongfig
```


## Quick start

You can follow the [quick start](docs/guide.md) to get going in 5 minutes.


## Apply config

You can have your config in [json](config.json.sample), [yaml](config.yml.sample), or [js](config.js.sample) if you need to support multiple environments.

```
kongfig apply --path config.yml --host localhost:8001
```

## Dump config

You can dump the existing configuration to a file or view it on a screen

```
kongfig dump --host localhost:8001 > config.yml
```
> You can omit the `--host` option if kong is on `localhost:8001` as this is the default value

You can specify the desired format by giving `--format` option with possible options of `json`, `yaml`, or `screen` that prints the config with colours.

```bash
kongfig dump --format screen
```

For APIs which uses custom consumer credential plugins, specify plugin and id name in <plugin>:<idValue> format with `--credential-schema` option.

```
kongfig apply --path config.yml --host localhost:8001 --credential-schema custom_jwt:key
```

For multiple plugins use --credential-schema as many as necessary

```
kongfig apply --path config.yml --host localhost:8001 --credential-schema "custom_jwt:key" --credential-schema "custom_oauth2:client_id"
```

## Schema

Note: If you change the name of an API/Plugin/Consumer and want to ensure the old one is removed automatically, do not delete or modify the old API/Plugin/Consumer section, other than to add the `ensure: "removed"` flag. Examples shown below.

> Notice the `attributes.username` config parameter below, this is used to map given username to consumer uuid

Api schema:

```yaml
apis:
  - name: mockbin # unique api name
    ensure: "present" # Set to "removed" to have Kongfig ensure the API is removed. Default is present.
    attributes:
      upstream_url: string # (required)
      hosts: [string]
      uris: [string]
      methods: ["POST", "GET"]
      strip_uri: bool
      preserve_host: bool
      retries: int
      upstream_connect_timeout: int
      upstream_read_timeout: int
      upstream_send_timeout: int
      https_only: bool # (required)
      http_if_terminated: bool

```

Api plugin schema:

```yaml
apis:
  - name: mockbin # unique api name
    attributes: # ...
    plugins:
      - name: rate-limiting # kong plugin name
        ensure: "present" # Set to "removed" to have Kongfig ensure the plugin is removed. Default is present.
        attributes: # the plugin attributes
          username: # optional, to reference a consumer, same as consumer_id in kong documentation
          config:

```

Global plugin schema:

```yaml
plugins:
  - name: cors
    attributes:
      username: # optional, to reference a consumer, same as consumer_id in kong documentation
      enabled: true
      config:
        credentials: false
        preflight_continue: false
        max_age: 7000
```

All of the kong plugins should be supported if you find one that doesn't work please [add an issue](https://github.com/mybuilder/kongfig/issues/new).

Consumer schema:

```yaml
consumers:
  - username: iphone-app
    custom_id: foobar-1234 # optional
```

Consumer credential schema:

```yaml
consumers:
  - username: iphone-app
    credentials:
      - name: key-auth
        attributes: # credential config attributes
```

Consumer ACL schema:

```yaml
consumers:
  - username: iphone-app
    acls:
      - group: acl-group-name
```

### Supported consumer credentials

> Notice the `anonymous_username` config parameter below, this is used to map username to consumer uuid

[Key Authentication](https://getkong.org/plugins/key-authentication/)

```yaml
apis:
  - name: mockbin # unique api name
    attributes: # ...
    plugins:
      - name: key-auth
        attributes:
          config:
            anonymous_username: # optional, same as just anonymous in kong api, maps given username to consumer uuid
            key_names:
            hide_credentials:

consumers:
  - username: iphone-app
    credentials:
      - name: key-auth
        attributes:
          key: # required
```

[Basic Authentication](https://getkong.org/plugins/basic-authentication/)

```yaml
apis:
  - name: mockbin
    attributes: # ...
    plugins:
      - name: basic-auth
        attributes:
          config:
            hide_credentials:

consumers:
  - username: iphone-app
    credentials:
      - name: basic-auth
        attributes:
          username: # required
          password:
```

[OAuth 2.0 Authentication](https://getkong.org/plugins/oauth2-authentication/)

```yaml
apis:
  - name: mockbin
    attributes: # ...
    plugins:
      - name: oauth2
        attributes:
          config:
            scopes:
            mandatory_scope:
            token_expiration:
            enable_authorization_code:
            enable_client_credentials:
            enable_implicit_grant:
            enable_password_grant:
            hide_credentials:

consumers:
  - username: iphone-app
    credentials:
      - name: oauth2
        attributes:
          name:
          client_id: # required
          client_secret:
          redirect_uri: string | [string] # required by kong
```

[HMAC Authentication](https://getkong.org/plugins/hmac-authentication/)

```yaml
apis:
  - name: mockbin
    attributes: # ...
    plugins:
      - name: hmac-auth
        attributes:
          config:
            hide_credentials:
            clock_skew:

consumers:
  - username: iphone-app
    credentials:
      - name: hmac-auth
        attributes:
          username: # required
          secret:
```

[JWT](https://getkong.org/plugins/jwt/)

```yaml
apis:
  - name: mockbin
    attributes: # ...
    plugins:
      - name: jwt
        attributes:
          config:
            uri_param_names:
            claims_to_verify:

consumers:
  - username: iphone-app
    credentials:
      - name: jwt
        attributes:
          key: # required
          secret:
```

### Custom Credential Schemas

It is possible to work with custom consumer credential plugins.

```yaml
apis:
  - name: mockbin
    attributes: # ...
    plugins:
      - name: custom_jwt
        attributes:
          config:
            uri_param_names:
            claims_to_verify:

consumers:
  - username: iphone-app
    credentials:
      - name: custom_jwt
        attributes:
          key: # required
          secret:

credentialSchema:
  custom_jwt:
    id: "key" # credential id name
```


### ACL Support

[Kong ACL documentation](https://getkong.org/plugins/acl/)

```yaml
apis:
  - name: mockbin
    attributes: # ...
    plugins:
      - name: "acl"
        ensure: "present"
        attributes:
          config.whitelist: "foo-group"

consumers:
  - username: "some-username"
    ensure: "present"
    acls:
      - group: "foo-group"
        ensure: "present"

      - group: "bar-group"
        ensure: "present"
```

### Upstream/Target Schema

[Kong Upstream Load Balancing Reference](https://getkong.org/docs/latest/loadbalancing/)

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
      slots: 100
```

### Certificates & SNIs

*A certificate object represents a public certificate/private key pair for an SSL certificate. These objects are used by Kong to handle SSL/TLS termination for encrypted requests. Certificates are optionally associated with SNI objects to tie a cert/key pair to one or more hostnames.*

[Kong Certificate Object Reference](https://getkong.org/docs/0.11.x/admin-api/#certificate-object)

*An SNI object represents a many-to-one mapping of hostnames to a certificate. That is, a certificate object can have many hostnames associated with it; when Kong receives an SSL request, it uses the SNI field in the Client Hello to lookup the certificate object based on the SNI associated with the certificate.*

[Kong SNI Objects Reference](https://getkong.org/docs/0.11.x/admin-api/#sni-objects)

```yaml
certificates:
  - ensure: present
    cert: >-
      -----BEGIN CERTIFICATE-----
      MIIDMjCCAhqgAwIBAgIJAPgRdnOdnX/SMA0GCSqGSIb3DQEBBQUAMBoxGDAWBgNV
      ....
    key: >-
      -----BEGIN RSA PRIVATE KEY-----
      MIIEpAIBAAKCAQEAo5BpOQY2AV/1L2QEdSip75rHh3Khs2knNtMLIrP26MHyidtX
      ....
    snis:
      - name: example.com
        ensure: present
      - name: www.example.com
        ensure: present
```

> Notice that SNIs are an list of object e.g. `{ name: example.com, ensure: present }` different Kong api itself where it is a list of hostnames


## Migrating from Kong <=0.9 to >=0.10

kongfig translates pre `>=0.10` kong config files automatically when applying them.

So you can export your config from `<=0.9` kong instance by running:

```bash
kongfig dump --host kong_9:8001 > config.v9.yml
```

Then apply it to kong `0.10` instance

```bash
kongfig apply --path config.v9.yml --host kong_10:8001
```

`apis` endpoint changed between `<=0.9` and `>=0.10`:
 * `request_host: string` to `hosts: [string]`
 * `request_path: string` to `uris: [string]`
 * `strip_request_path: bool` -> `strip_uri: bool`
 * Adds `methods`, `retries`, `upstream_connect_timeout`, `upstream_read_timeout`, `upstream_send_timeout`, `https_only`, `http_if_terminated`

---
Created by [MyBuilder](http://www.mybuilder.com/) - Check out our [blog](http://tech.mybuilder.com/) for more information and our other open-source projects.

## Contributing to Kongfig

We are very grateful for any contributions you can make to the project.

Visit the [Contributing](CONTRIBUTING.md) documentation for submission guidelines.
