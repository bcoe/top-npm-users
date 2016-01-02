/* global describe, it */

var TopUsers = require('../')
var fs = require('fs')
var nock = require('nock')
var rimraf = require('rimraf')

require('chai').should()
require('tap').mochaGlobals()

rimraf.sync('./output/npm-top-users.json')
rimraf.sync('./output/npm-top-users.md')

describe('DownloadCounts', function () {
  describe('calculate', function () {
    it('outputs npm-top-users.json', function (done) {
      var downloads = nock('https://api.npmjs.org')
        .get('/downloads/point/last-month/bejesus-cli')
        .reply(200, {
          downloads: 200000,
          start: '2015-12-03',
          end: '2016-01-01',
          package: 'bejesus-cli'
        })
      var dc = new TopUsers({
        ChangesStream: require('./fixtures/fake-changes-stream'),
        saveInterval: 25
      })

      dc.calculate()

      setTimeout(function () {
        downloads.done()
        dc.stop()

        var topUsers = JSON.parse(fs.readFileSync('./output/npm-top-users.json'))
        topUsers.DanBUK.should.equal(200000)

        return done()
      }, 200)
    })
  })

  describe('render', function () {
    it('renders npm-top-users.md', function (done) {
      var dc = new TopUsers()
      dc.render()

      var content = fs.readFileSync('./output/npm-top-users.md', 'utf-8')
      content.should.match(/1.*DanBUK.*200,000/)

      return done()
    })
  })
})
