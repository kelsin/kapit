var _ = require('lodash');
var cardinal = require('cardinal');

var data = require('./data');

exports.help = function() {
  var output = '';

  output += '{yellow-fg}Focused Element{/}';
  output += '\n {green-fg}j{/} move down a line';
  output += '\n {green-fg}k{/} move up a line';
  output += '\n {green-fg}ctrl-d{/} move down a page';
  output += '\n {green-fg}ctrl-u{/} move up a page';
  output += '\n {green-fg}g{/} move to the begining';
  output += '\n {green-fg}G{/} move to the end';
  output += '\n\n{yellow-fg}Application{/}';
  output += '\n {green-fg}q{/} quit';
  output += '\n {green-fg}s{/} save application state';
  output += '\n {green-fg}?{/} display help';
  output += '\n {green-fg}ctrl-n{/} next step in current chain';
  output += '\n {green-fg}ctrl-p{/} previous step in current chain';
  output += '\n {green-fg}w{/} display raw data instead of formatted request/response';
  output += '\n {green-fg}tab{/} switch focus between request and response';
  output += '\n\n{yellow-fg}Step{/}';
  output += '\n {green-fg}shift-n{/} create new step';
  output += '\n {green-fg}n{/} edit name';
  output += '\n {green-fg}t{/} edit type';
  output += '\n\n{yellow-fg}Request{/}';
  output += '\n {green-fg}a{/} edit action';
  output += '\n {green-fg}b{/} edit body (in editor)';
  output += '\n {green-fg}f{/} toggle json format';
  output += '\n {green-fg}h{/} edit header';
  output += '\n {green-fg}m{/} edit method';
  output += '\n {green-fg}u{/} edit url';
  output += '\n {green-fg}x{/} execute request';
  output += '\n\n{yellow-fg}Response{/}';
  output += '\n {green-fg}r{/} reset response';
  output += '\n {green-fg}R{/} reset all responses';

  return output;
};

exports.chain = function() {
  return _(data.getCurrentSteps()).map(function(step, index) {
    var color = '';

    if(index === data.getCurrentChain().current) {
      color += '{underline}';
    }

    if(step.response.error && !step.response.completed) {
      color += '{yellow-fg}';
    } else if(step.response.error) {
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
    delete outputStep.name;
    delete outputStep.type;
    delete outputStep.raw;
    delete outputStep.request;
    delete outputStep.render;

    output += cardinal.highlight(JSON.stringify(outputStep, null, 2),
                                 { json: true });
  } else if(step.response.error && !step.response.completed) {
    output += '{yellow-fg}Error:{/} ' + step.response.error;
  } else if(step.response.completed) {
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
    output += '{green-fg}Type{/}: ' + step.type + '\n\n';
    output += '{green-fg}' + step.request.action + '{/} ' + step.request.url + '\n';

  } else {
    var outputStep = _.cloneDeep(step);
    delete outputStep.response;
    delete outputStep.render;
    delete outputStep.raw;

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
