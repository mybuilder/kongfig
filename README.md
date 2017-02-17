<p align="center">
    <img src="logo.png">
</p>

# Kongfig

A tool for [Kong](https://getkong.org/) to allow declarative configuration.

Simply define your list of api's and consumers in json and then run kongfig to ensure that your Kong is configured correctly.

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

Api schema:

```yaml
apis:
  - name: mockbin # unique api name
    ensure: "present" # Set to "removed" to have Kongfig ensure the API is removed. Default is present.
    attributes:
      request_host:
      request_path:
      strip_request_path:
      preserve_host:
      upstream_url: # (required)
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
          consumer_id:
          config:

```

Global plugin schema:

```yaml
plugins:
  - name: cors
    attributes:
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

[Key Authentication](https://getkong.org/plugins/key-authentication/)

```yaml
apis:
  - name: mockbin # unique api name
    attributes: # ...
    plugins:
      - name: key-auth
        attributes:
          config:
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
          redirect_uri: # required by kong
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

---
Created by [MyBuilder](http://www.mybuilder.com/) - Check out our [blog](http://tech.mybuilder.com/) for more information and our other open-source projects.

## Contributing to Kongfig

We are very grateful for any contributions you can make to the project.

Visit the [Contributing](CONTRIBUTING.md) documentation for submission guidelines.
