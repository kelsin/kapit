var request = require('request');
var Promise = require("bluebird");

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
    request(step.request, function(error, response, body) {
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
