/* global describe, it */

var DownloadCounts = require('../')

require('chai').should()
require('tap').mochaGlobals()

describe('DownloadCounts', function () {
  describe('updateCounts', function () {
    it('walks changes stream and fetches download counts', function (done) {
      var dc = new DownloadCounts()
      dc.updateCounts()
      return done()
    })
  })
})
