var _ = require('lodash')
var fs = require('fs')
var handlebars = require('handlebars')
var mkdirp = require('mkdirp')
var moment = require('moment')
var path = require('path')
var queue = require('async').queue
var request = require('request')

function TopUsers (opts) {
  _.extend(this, {
    saveInterval: 15000,
    dirty: false,
    countsUrl: 'https://api.npmjs.org/downloads/point/last-month/',
    outputDirectory: './output/',
    jsonData: 'top-npm-users.json',
    templateName: 'top-npm-users.md',
    registryDb: 'https://replicate.npmjs.com/registry',
    downloadCounts: {},
    ChangesStream: require('changes-stream')
  }, opts)
}

let backoff = 5000
const backoffIncrement = 5000
const queueConcurrency = 4

TopUsers.prototype.calculate = function () {
  this._q = queue((task, callback) => {
    request.get({
      json: true,
      url: this.countsUrl + encodeURIComponent(task.name)
    }, (err, res, obj) => {
      if (res && [200, 404].indexOf(res.statusCode) === -1) {
        err = Error('unexpected status = ' + res.statusCode)
      }
      if (err) {
        console.warn(err.message)
        setTimeout(() => {
          console.info(`retrying task ${task.name} backoff now ${backoff}`)
          task.failures++
          if (task.failures < 3) this._q.push(task)
          return callback()
        }, backoff)
        backoff += backoffIncrement
      } else {
        backoff = backoffIncrement
        this.dirty = true
        this._updateUserCounts(task, obj.downloads)
        return callback()
      }
    })
  }, queueConcurrency)

  var changes = new this.ChangesStream({
    include_docs: true,
    db: this.registryDb
  })

  changes.on('readable', () => {
    var change = changes.read()

    if (change.seq % 100 === 0) console.log('sequence #' + change.seq)

    if (change.doc && change.doc.maintainers) {
      this._q.push({
        maintainers: change.doc.maintainers,
        name: change.doc.name,
        failures: 0
      }, (err) => {
        if (err) console.log(err.message)
      })
    }
  })

  this._saveInterval = setInterval(() => {
    if (this.dirty) {
      console.log('saving download counts (q = ' + this._q.length() + ')')
      mkdirp.sync(this.outputDirectory)
      fs.writeFileSync(this.outputDirectory + this.jsonData, JSON.stringify(this.downloadCounts, null, 2), 'utf-8')
    }
  }, this.saveInterval)
}

TopUsers.prototype._updateUserCounts = function (task, downloads) {
  task.maintainers.forEach((maintainer) => {
    if (!this.downloadCounts[maintainer.name]) this.downloadCounts[maintainer.name] = 0
    this.downloadCounts[maintainer.name] += downloads || 0
  })
}

TopUsers.prototype.render = function () {
  var template = handlebars.compile(
    fs.readFileSync(path.resolve(__dirname, this.templateName + '.mustache'), 'utf-8')
  )

  var result = template({
    end: moment().format('ll'),
    start: moment().subtract(1, 'month').format('ll'),
    users: this._top100Users().map((u, i) => {
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

  Object.keys(userMap).forEach((k) => {
    users.push({
      name: k,
      downloads: userMap[k]
    })
  })

  users.sort((a, b) => {
    return b.downloads - a.downloads
  })

  return users.slice(0, 100)
}

TopUsers.prototype.stop = function () {
  if (this._saveInterval) clearInterval(this._saveInterval)
}

module.exports = TopUsers
