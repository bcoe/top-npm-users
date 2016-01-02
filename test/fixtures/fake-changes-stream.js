var fs = require('fs')

function ChangesFeed () {}

ChangesFeed.prototype.on = function (event, cb) {
  return cb()
}

ChangesFeed.prototype.read = function () {
  return JSON.parse(
    fs.readFileSync('./test/fixtures/bejesus-cli.json')
  )
}

module.exports = ChangesFeed
