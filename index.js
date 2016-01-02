var _ = require('lodash')
var fs = require('fs')
var handlebars = require('handlebars')
var mkdirp = require('mkdirp')
var moment = require('moment')
var queue = require('async').queue
var request = require('request')

function TopUsers (opts) {
  _.extend(this, {
    saveInterval: 15000,
    dirty: false,
    countsUrl: 'https://api.npmjs.org/downloads/point/last-month/',
    outputDirectory: './output/',
    jsonData: 'npm-top-users.json',
    templateName: 'npm-top-users.md',
    registryDb: 'https://skimdb.npmjs.com/registry',
    downloadCounts: {},
    ChangesStream: require('changes-stream')
  }, opts)
}

TopUsers.prototype.calculate = function () {
  var _this = this

  this._q = queue(function (task, callback) {
    request.get({
      json: true,
      url: _this.countsUrl + encodeURIComponent(task.name)
    }, function (err, res, obj) {
      if (err) return callback(err)
      if (res.statusCode !== 200) return callback(Error('unexpected status = ' + res.statusCode))
      _this.dirty = true
      _this._updateUserCounts(task, obj.downloads)
      return callback()
    })
  }, 5)

  var changes = new this.ChangesStream({
    include_docs: true,
    db: this.registryDb
  })

  changes.on('readable', function () {
    var change = changes.read()

    if (change.seq % 100 === 0) console.log('sequence #' + change.seq)

    if (change.doc && change.doc.maintainers) {
      _this._q.push({
        maintainers: change.doc.maintainers,
        name: change.doc.name
      }, function (err) {
        if (err) console.log(err.message)
      })
    }
  })

  this._saveInterval = setInterval(function () {
    if (_this.dirty) {
      console.log('saving download counts (q = ' + _this._q.length() + ')')
      mkdirp.sync(_this.outputDirectory)
      fs.writeFileSync(_this.outputDirectory + _this.jsonData, JSON.stringify(_this.downloadCounts, null, 2), 'utf-8')
    }
  }, this.saveInterval)
}

TopUsers.prototype._updateUserCounts = function (task, downloads) {
  var _this = this
  task.maintainers.forEach(function (maintainer) {
    if (!_this.downloadCounts[maintainer.name]) _this.downloadCounts[maintainer.name] = 0
    _this.downloadCounts[maintainer.name] += downloads || 0
  })
}

TopUsers.prototype.render = function () {
  var template = handlebars.compile(fs.readFileSync(this.templateName + '.mustache', 'utf-8'))

  var result = template({
    end: moment().format('ll'),
    start: moment().subtract(1, 'month').format('ll'),
    users: this._top100Users().map(function (u, i) {
      return {
        name: u.name,
        downloads: u.downloads.toLocaleString(),
        index: i + 1
      }
    })
  })

  mkdirp.sync(this.outputDirectory)
  fs.writeFileSync(this.outputDirectory + this.templateName, result, 'utf-8')
}

TopUsers.prototype._top100Users = function () {
  var userMap = JSON.parse(fs.readFileSync(this.outputDirectory + this.jsonData, 'utf-8'))
  var users = []

  Object.keys(userMap).forEach(function (k) {
    users.push({
      name: k,
      downloads: userMap[k]
    })
  })

  users.sort(function (a, b) {
    return b.downloads - a.downloads
  })

  return users.slice(0, 100)
}

TopUsers.prototype.stop = function () {
  if (this._saveInterval) clearInterval(this._saveInterval)
}

module.exports = TopUsers
