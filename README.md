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

---
Created by [MyBuilder](http://www.mybuilder.com/) - Check out our [blog](http://tech.mybuilder.com/) for more information and our other open-source projects.

## Contributing to Kongfig

We are very grateful for any contributions you can make to the project.

Visit the [Contributing](CONTRIBUTING.md) documentation for submission guidelines.
