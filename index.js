#!/usr/bin/env node

process.title = 'Flight';

var _ = require('lodash');
var blessed = require('blessed');
var cardinal = require('cardinal');
var http = require('request');

var screen = blessed.screen();

var data = {
  activeRequest: 2,
  chain: [{
    name: 'Authorize',
    type: 'OAUTH',
    method: 'authorize',
    url: 'https://us.battle.net/oauth/authorize'
  }, {
    name: 'Access Token',
    type: 'OAUTH',
    method: 'token',
    url: 'https://us.battle.net/oauth/token'
  }, {
    name: 'Get Hero',
    type: 'HTTP',
    http: {
      url: 'https://us.api.battle.net/data/cgiroir/hero/kerrigan',
      method: 'GET',
      headers: {
        Authorization: 'Bearer 345'
      }
    }
  }]
}

var section = function(text, options) {
  var box = blessed.box(_.merge({
    padding: {
      left: 1,
      right: 1
    },
    tags: true,
    border: {
      type: 'line',
      fg: 'black'
    }
  }, options));

  var title = blessed.text({
    parent: box,
    align: 'center',
    height: 1,
    width: text.length + 2,
    left: 1,
    content: text,
    style: {
      fg: 'blue'
    }
  });

  return box;
};

var chain = section('Chain', {
  align: 'center',
  width: '100%',
  height: 4,
  content: ''
});

var chainProgress = blessed.ProgressBar({
  parent: chain,
  orientation: 'horizontal',
  filled: 50,
  top: 2,
  left: 2,
  right: 2,
  height: 1,
  style: {
    bg: 0,
    bar: {
      bg: 13
    }
  }
});

var request = section('Request', {
  width: '50%',
  top: 4,
  bottom: 3
});

var output = section('Output', {
  width: '50%',
  right: 0,
  top: 4,
  bottom: 3
});

screen.append(chain);
screen.append(request);
screen.append(output);

screen.key('q', function(ch, key) {
  return process.exit(0);
});

screen.key('n', function(ch, key) {
  data.activeRequest = Math.min((data.chain.length - 1), data.activeRequest + 1);
  update();
});

screen.key('p', function(ch, key) {
  data.activeRequest = Math.max(0, data.activeRequest - 1);
  update();
});

screen.key('x', function(ch, key) {
  var activeRequest = data.chain[data.activeRequest];

  if(activeRequest.type === 'HTTP') {
    http({
      method: activeRequest.http.method,
      url: activeRequest.http.url,
      headers: activeRequest.http.headers,
      json: true
    }, function(error, response, body) {
      if(error || response.statusCode !== 200) {
        activeRequest.error = true;
      }

      activeRequest.completed = true;

      var result = '{green-fg}status{/}: ' + response.statusCode + '\n';
      result += _.reduce(response.headers, function(str, value, header) {
        return str += '{green-fg}' + header + '{/}: ' + value + '\n';
      }, '');
      result += '\n';
      result += cardinal.highlight(JSON.stringify(body, null, 2), { json: true });

      activeRequest.output = result;

      update();
    });
  }
});

screen.key('r', function(ch, key) {
  delete data.chain[data.activeRequest].completed;
  delete data.chain[data.activeRequest].output;
  update();
});

var update = function() {
  chain.setContent(_(data.chain).map(function(request, index) {
    var color = '';

    if(index === data.activeRequest) {
      color += '{underline}{yellow-fg}';
    }

    if(request.completed) {
      if(request.error) {
        color += '{red-fg}';
      } else {
        color += '{green-fg}';
      }
    } else {
      color += '{blue-fg}';
    }

    return color + request.name + '{/}';
  }).join(' → '));

  // find number of completed requests
  data.completed = _(data.chain).reduce(function (total, request) {
    if(request.completed) {
      return total + 1;
    } else {
      return total;
    }
  }, 0);

  chainProgress.setProgress(Math.round(data.completed / data.chain.length * 100.0));

  // Data output for now
  var requestContent = _.cloneDeep(data.chain[data.activeRequest]);
  delete requestContent.output;
  request.setContent(cardinal.highlight(JSON.stringify(requestContent, null, 2), { json: true }));

  if(data.chain[data.activeRequest].output) {
    output.setContent(data.chain[data.activeRequest].output);
  } else {
    output.setContent('');
  }

  screen.render();
};

update();
