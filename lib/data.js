var _ = require('lodash');
var fs = require('fs');
var osenv = require('osenv');
var path = require('path');
var Promise = require("bluebird");

// Promisification
Promise.promisifyAll(fs);

var defaults = {
  current: null,
  chains: []
};

var newStep = {
  name: 'New Request',
  type: 'HTTP',
  raw: false,
  request: {
    url: 'https://us.battle.net/api/wow/character/bronzebeard/Emacs?fields=pets,mounts',
    method: 'GET',
    json: true
  },
  response: {
    completed: false,
    error: false
  },
  render: {}
};

var data = {
  current: 0,
  chains: [{
    name: 'default',
    current: 2,
    steps: [{
      name: 'Authorize',
      type: 'OAUTH',
      raw: false,
      request: {
        action: 'authorize',
        url: 'https://us.battle.net/oauth/authorize'
      },
      response: {
        completed: false,
        error: false
      },
      render: {}
    }, {
      name: 'Access Token',
      type: 'OAUTH',
      raw: false,
      request: {
        action: 'token',
        url: 'https://us.battle.net/oauth/token'
      },
      response: {
        completed: false,
        error: false
      },
      render: {}
    }, {
      name: 'Get Hero',
      type: 'HTTP',
      raw: false,
      request: {
        url: 'https://us.api.battle.net/data/cgiroir/hero/kerrigan',
        method: 'GET',
        json: true,
        headers: {
          Authorization: 'Bearer 345'
        }
      },
      response: {
        completed: false,
        error: false
      },
      render: {}
    }, {
      name: 'Get Character',
      type: 'HTTP',
      raw: false,
      request: {
        url: 'https://us.battle.net/api/wow/character/bronzebeard/Emacs?fields=pets,mounts',
        method: 'GET',
        json: true
      },
      response: {
        completed: false,
        error: false
      },
      render: {}
    }]
  }]
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

exports.raw = function() {
  return exports.getCurrentStep().raw;
};

exports.toggleRaw = function() {
  var step = exports.getCurrentStep();
  step.raw = !step.raw;
};

exports.save = function() {
  var filename = data.filename || defaultDataFile();
  return fs.writeFileAsync(filename,
                           JSON.stringify(data, null, 2),
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
  return _.map(data.chains, function(chain) {
    return chain.name;
  });
};

exports.getChain = function(index) {
  return data.chains[index];
};

exports.getCurrentChain = function() {
  return exports.getChain(data.current);
};

exports.getCurrentSteps = function() {
  var chain = exports.getCurrentChain();
  return chain.steps;
};

exports.getCurrentStep = function() {
  var chain = exports.getCurrentChain();
  return chain.steps[chain.current];
};

exports.newStep = function() {
  var s = _.cloneDeep(newStep);
  var chain = exports.getCurrentChain();
  var length = chain.steps.push(s);
  chain.current = length - 1;
  return s;
};

exports.deleteStep = function() {
  var chain = exports.getCurrentChain();
  var removed = chain.steps.splice(chain.current, 1);

  chain.current--;
  if (chain.steps.length > 0 && chain.current === -1) {
    chain.current = 0;
  }

  return removed;
};

exports.resetAllSteps = function(d) {
  _.each((d || data).chains, function(chain) {
    _.each(chain.steps, function(step) {
      exports.resetStep(step);
    });
  });
};

exports.resetStep = function(step) {
  step = step || exports.getCurrentStep();
  step.response = _.cloneDeep(newStep.response);
  delete step.render.response;
};

exports.nextStep = function() {
  var chain = exports.getCurrentChain();
  chain.current = Math.min((chain.steps.length - 1), chain.current + 1);
};

exports.prevStep = function() {
  var chain = exports.getCurrentChain();
  chain.current = Math.max(0, chain.current - 1);
};
