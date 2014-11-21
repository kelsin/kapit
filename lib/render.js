var _ = require('lodash');
var cardinal = require('cardinal');

var data = require('./data');

exports.chain = function() {
  return _(data.getCurrentSteps()).map(function(step, index) {
    var color = '';

    if(index === data.getCurrentChain().current) {
      color += '{underline}{yellow-fg}';
    }

    if(step.response.error) {
      color += '{red-fg}';
    } else if(step.response.completed) {
      color += '{green-fg}';
    } else {
      color += '{blue-fg}';
    }

    color += step.name + '{/}';

    return color;
  }).join(' → ');
};

exports.response = function(step) {
  var output = '';

  if(data.raw()) {
    var outputStep = _.cloneDeep(step);
    delete outputStep.request;
    outputStep.render.request = !!outputStep.render.request;
    outputStep.render.response = !!outputStep.render.response;

    output += cardinal.highlight(JSON.stringify(outputStep, null, 2),
                                 { json: true });
  } else {
    // Status
    output += '{yellow-fg}status{/}: ';
    if(step.response.error) {
      output += '{red-fg}';
    } else {
      output += '{green-fg}';
    }
    output += step.response.status + '{/}\n\n';

    // Headers
    output += _.reduce(step.response.headers, function(str, value, header) {
      return str += '{yellow-fg}' + header + '{/}: ' + value + '\n';
    }, '');
    output += '\n';
    output += cardinal.highlight(JSON.stringify(step.response.body, null, 2),
                                 { json: true });
  }

  return output;
};

exports.body = function(request) {
  var body = '';
  if(request.body) {
    try {
      return cardinal.highlight(JSON.stringify(JSON.parse(request.body || '{}'),
                                               null,
                                               2),
                                { json: true });
    }
    catch (e) {
      return request.body;
    }
  } else {
    return '';
  }
};

exports.request = function(step) {
  var output = '';

  if (step.type === 'HTTP' && !data.raw()) {
    output += '{green-fg}Name{/}: ' + step.name + '\n';
    output += '{green-fg}Type{/}: ' + step.type + '\n';

    if(step.request.json) {
      output += '{green-fg}Format{/}: JSON\n';
    }
    output += '\n';
    output += '{green-fg}' + step.request.method + '{/} ' + step.request.url + '\n';
    _.each(step.request.headers, function(value, key) {
      output += '{green-fg}' + key + '{/}: ' + value + '\n';
    });
    output += '\n';

    output += exports.body(step.request);

  } else if (step.type === 'OAUTH' && !data.raw()) {
    output += '{green-fg}Name{/}: ' + step.name + '\n';
    output += '{green-fg}Type{/}: ' + step.type + '\n';
    output += '{green-fg}Endpoint{/}: ' + step.request.endpoint + '\n';

  } else {
    var outputStep = _.cloneDeep(step);
    delete outputStep.response;
    outputStep.render.request = !!outputStep.render.request;
    outputStep.render.response = !!outputStep.render.response;

    try {
      outputStep.request.body = JSON.parse(step.request.body);
    }
    catch (e) {
      outputStep.request.body = _.cloneDeep(step.request.body);
    }

    output += cardinal.highlight(JSON.stringify(outputStep, null, 2),
                                 { json: true });
  }

  return output;
};
