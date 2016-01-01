#!/usr/bin/env node

var DownloadCounts = require('../')

require('yargs')
  .command('update-counts', 'walk the registry changes feed and update user download counts', function (yargs, argv) {
    var dc = new DownloadCounts()
    dc.updateCounts()
  })
  .help('h')
  .alias('h', 'help')
  .argv
