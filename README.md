# top-npm-users ([git.io/npm-top](http://git.io/npm-top))

[![Build Status](https://travis-ci.org/bcoe/top-npm-users.svg)](https://travis-ci.org/bcoe/top-npm-users)
[![Coverage Status](https://coveralls.io/repos/bcoe/top-npm-users/badge.svg?branch=master)](https://coveralls.io/r/bcoe/top-npm-users?branch=master)
[![NPM version](https://img.shields.io/npm/v/top-npm-users.svg)](https://www.npmjs.com/top-npm-users)

npm users sorted by the monthly downloads of their modules.

Inspired by [top-github-users](https://github.com/paulmillr/top-github-users)

## Installing

```
npm i top-npm-users -g
```

## Usage

Generate the statistics:

```sh
top-npm-users calculate
```

Generate the Markdown:

```sh
top-npm-users render
```

## How Counts Are Calculated

top-npm-users walks a stream of the npm registry using [changes-stream](https://www.npmjs.com/package/changes-stream) and pulls down statistics
from the [npm download counts api](https://github.com/npm/download-counts).

## License

ISC
