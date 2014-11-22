var _ = require('lodash');
var handlebars = require('handlebars');
var request = require('request');
var Promise = require("bluebird");

var data = require('./data');

/**
 * Runs the provided javascript object through handlebars
 */
var compile = function(request) {
  var context = data.context();

  function loop(obj) {
    if (_.isArray(obj)) {
      return _.map(obj, loop);
    } else if (_.isPlainObject(obj)) {
      return _.mapValues(obj, loop);
    } else if (_.isString(obj)) {
      return handlebars.compile(obj)(context);
    } else {
      return obj;
    }
  };

  return loop(request);
};

exports.step = function(step) {
  switch (step.type) {
  case 'HTTP':
    return exports.http(step);
    break;
  case 'OAUTH':
    return exports.oauth(step);
    break;
  default:
    return Promise.reject(new Error('Unknown request type: ' + step.type));
    break;
  }
};

exports.http = function(step) {
  return new Promise(function (resolve) {
    step.compiled = compile(step.request);

    request(step.compiled, function(error, response, body) {
      step.response.status = response.statusCode;
      step.response.completed = true;

      if(error || response.statusCode !== 200) {
        step.response.error = true;
      }

      step.response.headers = response.headers;
      step.response.body = body;

      resolve(response);
    });
  });
};

exports.oauth = function(step) {
  switch (step.request.action) {
  case 'authorize':
    return exports.oauthAuthorize(step);
    break;
  case 'token':
    return exports.oauthToken(step);
    break;
  default:
    return Promise.reject(new Error('Unknown OAuth action: ' + step.request.action));
    break;
  }
};

exports.oauthAuthorize = function(step) {
  return Promise.reject(new Error('Unimplemented'));
};

exports.oauthToken = function(step) {
  return Promise.reject(new Error('Unimplemented'));
};
