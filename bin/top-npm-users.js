#!/usr/bin/env node

var TopUsers = require('../')

require('yargs')
  .usage('$0 [command]')
  .command('calculate', 'walk the registry changes feed and calculate user download counts', function (yargs, argv) {
    var dc = new TopUsers()
    dc.calculate()
  })
  .command('render', 'read in top-npm-users.json and render the markdown report', function (yargs, argv) {
    var dc = new TopUsers()
    dc.render()
  })
  .help('h')
  .alias('h', 'help')
  .demand(1, 'a command must be provided')
  .parse()
