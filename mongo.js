var EventEmitter = require('events').EventEmitter;
var log = require('debug')('sourced-repo-mongo');
var MongoClient = require('mongodb').MongoClient;
var Server = require('mongodb').Server;
var url = require('url');
var util = require('util');

function Mongo () {
  this.client = null;
  this.db = null;
  this.connected = false;
  EventEmitter.call(this);
}

util.inherits(Mongo, EventEmitter);

Mongo.prototype.isConnected = function () {
  return this.connected;
}

Mongo.prototype.connect = function connect (mongoUrl, database, options = {
  useNewUrlParser: true,
  useUnifiedTopology: true
}) {
  var self = this;
  return new Promise((resolve, reject) => {
    self.on('connected', (db) => {
      self.connect = true
      resolve(db)
    })
    self.on('close', (db) => {
      self.connect = false
    })
    self.on('error', (err) => {
      reject(err)
    })
    MongoClient.connect(mongoUrl, options, function (err, client) {
      if (err) {
        log('✗ MongoDB Connection Error. Please make sure MongoDB is running: ', err);
        self.emit('error', err);
      }
      var expanded = url.parse(mongoUrl);
      // replica set url does not include db, it is passed in separately
      var dbName = database || expanded.pathname.replace('/', '');
      self.client = client;
      var db = client.db(dbName);
      self.db = db;
      log('initialized connection to mongo at %s', mongoUrl);
      self.emit('connected', db);
    });
  })
};

Mongo.prototype.close = function (cb) {
  log('closing sourced mongo connection');
  return this.client.close((err) => {
    log('closed sourced mongo connection');
    cb(err)
  });
};

module.exports = new Mongo();