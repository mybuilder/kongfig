# Contributing to Kongfig

We are very grateful for any contributions you can make to the project.

## Submitting a Pull Request

Before submitting your request, we kindly ask you to:

- Include tests related to your changes
- Consider squashing your commits, so as to keep the history clean and succinct


## Setup

To compile the `kongfig` you need babel-cli

```bash
npm install --global babel-cli
```

Install the package dependencies

```bash
npm install
```

## Running tests

```bash
npm test
```

or even more conveniently you can run the test continuously on file changes.

```bash
npm test -- --watch
```

## Compiling bin/kongfig

```bash
npm run build
```

or compile continuously on file changes.

```bash
npm run build -- --watch
```
