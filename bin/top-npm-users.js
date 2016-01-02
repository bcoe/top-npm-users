#!/usr/bin/env node

var DownloadCounts = require('../')

require('yargs')
  .command('update-counts', 'walk the registry changes feed and update user download counts', function (yargs, argv) {
    var dc = new DownloadCounts()
    dc.updateCounts()
  })
  .command('render-top-users', 'read in npm-top-users.json and output the markdown report', function (yargs, argv) {
    var dc = new DownloadCounts()
    dc.renderTopUsers()
  })
  .help('h')
  .alias('h', 'help')
  .demand(1, 'a command must be provided')
  .argv
