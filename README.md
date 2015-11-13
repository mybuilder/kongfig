<p align="center">
    <img src="logo.png">
</p>

# Kongfig

A tool for [Kong](https://getkong.org/) to allow declarative configuration.

Simply define your list of api's and consumers in json and then run kongfig to ensure that your Kong is configured correctly.

[![Build Status](https://travis-ci.org/mybuilder/kongfig.svg)](https://travis-ci.org/mybuilder/kongfig)

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


## Loosely following the Kong's 5-minute Quickstart guide

Read more on [Kong's docs - 5-minute Quickstart](https://getkong.org/docs/latest/getting-started/quickstart)

## Add your API using the declarative config

Create a `config.json` or `config.yml` file and describe your api.

```yaml
---
  apis:
    -
      name: "mockbin"
      attributes:
        upstream_url: "http://mockbin.com/"
        request_host: "mockbin.com"
```

```json
{
    "apis": [
        {
            "name": "mockbin",
            "attributes": {
                "upstream_url": "http://mockbin.com/",
                "request_host": "mockbin.com"
            }
        }
    ]
}
```

Apply this configuration using:

```bash
kongfig --path ./config.json --host localhost:8001
```

You should see a similar command output when applying the config:

```bash
...

POST 201 http://localhost:8001/apis
 { upstream_url: 'http://mockbin.com/',
   request_host: 'mockbin.com',
   name: 'mockbin' }
Response status Created:
 { upstream_url: 'http://mockbin.com/',
   id: '94219b08-e70e-44a4-c4cd-bf3c9bc31ca1',
   name: 'mockbin',
   created_at: 1445247516000,
   request_host: 'mockbin.com' }
```

### Override configuration

It's also possible to override an existing configuration from an existing .yml or .json file. Example, given this API definition:

```yaml
---
  apis:
    -
      name: "mockbin"
      attributes:
        upstream_url: "http://mockbin.com/"
        request_host: "mockbin.com"
```

```json
{
    "apis": [
        {
            "name": "mockbin",
            "attributes": {
                "upstream_url": "http://mockbin.com/",
                "request_host": "mockbin.com"
            }
        }
    ]
}
```

and this override configuration: 

```yaml
---
  apis:
    -
      name: "mockbin"
      attributes:
        upstream_url: "http://dev.mockbin.com/"
        request_host: "dev.mockbin.com"
```

```json
{
    "apis": [
        {
            "name": "mockbin",
            "attributes": {
                "upstream_url": "http://dev.mockbin.com/",
                "request_host": "dev.mockbin.com"
            }
        }
    ]
}
```

we can apply this configuration/override set with:

```bash
kongfig --path ./config.json --override ./override.json --host localhost:8001
```

You should see a similar command output when applying the config:

```bash
...

POST 201 http://localhost:8001/apis
 { upstream_url: 'http://dev.mockbin.com/',
   request_host: 'dev.mockbin.com',
   name: 'mockbin' }
Response status Created:
 { upstream_url: 'http://dev.mockbin.com/',
   id: '94219b08-e70e-44a4-c4cd-bf3c9bc31ca1',
   name: 'mockbin',
   created_at: 1445247516000,
   request_host: 'dev.mockbin.com' }
```

### Forward your requests through Kong

```bash
curl -i -X GET \
  --url http://localhost:8000/ \
  --header 'Host: mockbin.com'
```


## Enabling Plugins

> Prerequisite: Ensure any plugin you want to use has been enabled within Kong's configuration - [Enabling Plugins](https://getkong.org/docs/latest/getting-started/enabling-plugins)

### Configure the plugin for your API

Update the `config.json` file that describes your api.

```json
{
    "apis": [
        {
            "name": "mockbin",
            "attributes": {
                "upstream_url": "http://mockbin.com/",
                "request_host": "mockbin.com"
            },
            "plugins": [
                {
                    "name": "key-auth"
                }
            ]
        }
    ]
}
```

Apply this configuration using:

```bash
kongfig --path ./config.json --host localhost:8001
```

You should see the following within the command output when applying the config:

```bash
...

POST 201 http://localhost:8001/apis/mockbin/plugins
 { name: 'key-auth' }
Response status Created:
 { api_id: '94219b08-e70e-44a4-c4cd-bf3c9bc31ca1',
   id: '2e34fd09-dce2-4f5d-cf55-99bc68e19843',
   created_at: 1445248597000,
   enabled: true,
   name: 'key-auth',
   config: { key_names: [ 'apikey' ], hide_credentials: false } }
```


### Verify that the plugin is enabled for your API

Issue the following cURL request to verify that the *key-auth* plugin was enabled for your API:

```bash
curl -i -X GET \
  --url http://localhost:8000/ \
  --header 'Host: mockbin.com'
```

The response should be 403 Forbidden.


## Adding Consumers

We currently have support for managing a limited set of consumers i.e. internal applications and services.

If you have a finite set of your own applications that need access to your API's (i.e. a mobile app, micro-services deployed by Puppet), then the following approach will work well for you.

> Currently limited to the first page of consumers (that is 100) returned by the Kong API


### Create a Consumer

Declare your consumer in your `config.json` file

```json
{
    "apis": [
        "..."
    ],

    "consumers": [
        {
            "username": "iphone-app"
        }
    ]
}
```

```bash
kongfig --path ./config.json --host localhost:8001
```

You should see the following within the command output when applying the config:

```bash
POST 201 http://localhost:8001/consumers
 { username: 'iphone-app' }
Response status Created:
 { username: 'iphone-app',
   created_at: 1445251342000,
   id: '3f18c498-10fe-4937-c910-3b6cb7cc7b49' }
```

### Adding credentials

Declare your consumer credentials in your `config.json` file

```json
{
    "consumers": [
        {
            "username": "iphone-app",
            "credentials": [
                {
                    "name": "key-auth",
                    "attributes": {
                        "key": "very-secret-key"
                    }
                }
            ]
        }
    ]
}
```

You should see the following within the command output when applying the config:

```bash
...

POST 201 http://localhost:8001/consumers/iphone-app/key-auth
 { key: 'very-secret-key' }
Response status Created:
 { created_at: 1445251445000,
   consumer_id: '3f18c498-10fe-4937-c910-3b6cb7cc7b49',
   key: 'very-secret-key',
   id: 'feb787a9-fc44-47b3-c743-7575ef6a65a5' }
```

### Verify that your Consumer credentials are valid

```bash
curl -i -X GET \
  --url http://localhost:8000 \
  --header "Host: mockbin.com" \
  --header "apikey: very-secret-key"
```

## Specifying the Kong Host

You can alternatively specify the desired host in the configuration file itself, like so:

```json
{
    "host": "localhost:8001",
    "apis": [
        "..."
    ]
}
```

## Removing Declarations

You are able to ensure that previous declarations have been removed, like so:

```json
{
    "apis": [
        {
            "name": "mockbin",
            "ensure": "removed"
        }
    ]
}
```


## Development environment

To setup a development environment make sure you have Node/Npm installed and then:

    $ npm install

    $ NODE_PATH=./src ./node_modules/.bin/babel-node src/cli.js -- --path config.yml --host localhost:8000


---
Created by [MyBuilder](http://www.mybuilder.com/) - Check out our [blog](http://tech.mybuilder.com/) for more information and our other open-source projects.
