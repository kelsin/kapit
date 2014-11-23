var url = require('url');
var querystring = require('querystring');

var _ = require('lodash');
var handlebars = require('handlebars');
var request = require('request');
var osenv = require('osenv');
var Promise = require("bluebird");

var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');

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
      return handlebars.compile(obj, { noEscape: true })(context);
    } else {
      return obj;
    }
  };

  return loop(request);
};

exports.step = function(step) {
  step.compiled = compile(step.request);

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
    request(step.compiled, function(error, response, body) {
      step.response.status = response.statusCode;
      step.response.completed = true;

      if(error || response.statusCode !== 200) {
        step.response.error = true;
      }

      step.response.headers = response.headers;
      step.response.body = body;

      resolve(step.response);
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

exports.driver = function(browser) {
  browser = browser || 'phantomjs';

  var builder = new webdriver.Builder()
        .withCapabilities(webdriver.Capabilities[browser]());

  if (browser === 'chrome') {
    var options = new chrome.Options();
    options.addArguments('user-data-dir=' + osenv.home() + '/.flight/chrome-profile');
    builder.setChromeOptions(options);
  }

  return builder.build();
};

exports.oauthAuthorize = function(step) {
  var data = step.compiled.data;

  var driver = exports.driver(data.browser);

  var endpoint = url.parse(step.compiled.url);
  // endpoint.query = {
  //   response_type: 'code',
  //   client_id: data.client.id,
  //   redirect_uri: data.redirect_uri,
  //   scope: data.scope
  // };

  return new Promise(function(resolve, reject) {
    driver
      .get(url.format(endpoint))
      .then(function() {
        driver.switchTo();

        driver.wait(function() {
          return driver.getTitle().then(function(title) {
            return title.indexOf(data.redirect_uri) === 0;
          });
        }, 60000);

        driver.getTitle().then(function(title) {
          step.response.completed = true;
          step.response.code = url.parse(title.split(' ')[0], true).query.code;
        });

        driver.quit().then(function() {
          resolve(step.response);
        });
      });
  });
};

exports.oauthToken = function(step) {
  return Promise.reject(new Error('Unimplemented'));
};
