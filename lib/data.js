var _ = require('lodash');
var fs = require('fs');
var osenv = require('osenv');
var path = require('path');
var Promise = require("bluebird");

// Promisification
Promise.promisifyAll(fs);

var defaults = {
  current: null,
  chains: {}
};

var request = {
  name: 'New Request',
  type: 'HTTP',
  http: {
    url: 'https://us.battle.net/api/wow/character/bronzebeard/Emacs?fields=pets,mounts',
    method: 'GET',
    json: true
  }
};

var data = {
  current: 'default',
  chains: {
    'default': {
      current: 2,
      requests: [{
        name: 'Authorize',
        type: 'OAUTH',
        endpoint: 'https://us.battle.net/oauth/authorize'
      }, {
        name: 'Access Token',
        type: 'OAUTH',
        endpoint: 'https://us.battle.net/oauth/token'
      }, {
        name: 'Get Hero',
        type: 'HTTP',
        http: {
          url: 'https://us.api.battle.net/data/cgiroir/hero/kerrigan',
          method: 'GET',
          json: true,
          headers: {
            Authorization: 'Bearer 345'
          }
        }
      }, {
        name: 'Get Character',
        type: 'HTTP',
        http: {
          url: 'https://us.battle.net/api/wow/character/bronzebeard/Emacs?fields=pets,mounts',
          method: 'GET',
          json: true
        }
      }]
    }
  }
};

var defaultDataFilename = function() {
  return (process.platform == 'win32') ? '_flight' : '.flight';
};

var defaultDataFile = function() {
  return path.join(osenv.home(), defaultDataFilename());
};

exports.getData = function() {
  return data;
};

exports.save = function() {
  var filename = data.filename || defaultDataFile();

  var saveData = _.cloneDeep(data);
  exports.resetAllRequests(saveData);
  delete saveData.filename;
  return fs.writeFileAsync(filename,
                           JSON.stringify(saveData, null, 2),
                           { mode: 384 });
};

exports.load = function(arg) {
  var filename = arg || defaultDataFile();

  return fs.readFileAsync(filename)
    .then(JSON.parse)
    .then(function(val) {
      data = val;
      data.filename = filename;
      return data;
    })
    .catch(function(e) {
    });
};

exports.getChains = function() {
  return data.chains;
};

exports.getChainNames = function() {
  return _.keys(data.chains);
};

exports.getChain = function(name) {
  return data.chains[name];
};

exports.getCurrentChain = function() {
  return exports.getChain(data.current);
};

exports.getCurrentRequests = function() {
  var chain = exports.getCurrentChain();
  return chain.requests;
};

exports.getCurrentRequest = function() {
  var chain = exports.getCurrentChain();
  return chain.requests[chain.current];
};

exports.newRequest = function() {
  var r = _.cloneDeep(request);
  var chain = exports.getCurrentChain();
  var length = chain.requests.push(r);
  chain.current = length - 1;
  return r;
};

exports.resetAllRequests = function(d) {
  _.each((d || data).chains, function(chain, name) {
    _.each(chain.requests, function(request) {
      exports.resetRequest(request);
    });
  });
};

exports.resetRequest = function(request) {
  request = request || exports.getCurrentRequest();
  delete request.completed;
  delete request.output;
  delete request.error;
};

exports.nextRequest = function() {
  var chain = exports.getCurrentChain();
  chain.current = Math.min((chain.requests.length - 1), chain.current + 1);
};

exports.prevRequest = function() {
  var chain = exports.getCurrentChain();
  chain.current = Math.max(0, chain.current - 1);
};
