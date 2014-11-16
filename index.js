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
      fg: 'magenta'
    }
  });

  return box;
};

var chain = section('Chain', {
  align: 'left',
  width: '100%',
  height: 3,
  content: ''
});

var request = section('Request', {
  width: '50%',
  top: 3,
  bottom: 0
});

var output = section('Output', {
  width: '50%',
  right: 0,
  top: 3,
  bottom: 0
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

  activeRequest.output = '{bold}{red-fg}Loading ...{/}';
  update();

  if(activeRequest.type === 'HTTP') {
    http(activeRequest.http, function(error, response, body) {
      if(error || response.statusCode !== 200) {
        activeRequest.error = true;
      } else {
        activeRequest.completed = true;
      }

      // Output Status
      var result = '{yellow-fg}STATUS{/}: ';
      if(activeRequest.error) {
        result += '{red-fg}';
      } else {
        result += '{green-fg}';
      }
      result += response.statusCode + '{/}\n\n';

      // Output Headers
      result += _.reduce(response.headers, function(str, value, header) {
        return str += '{yellow-fg}' + header + '{/}: ' + value + '\n';
      }, '');
      result += '\n';
      result += cardinal.highlight(JSON.stringify(body, null, 2), { json: true });

      activeRequest.output = result;

      update();
    });
  } else {
    activeRequest.output = '{red-fg}Unknown type!{/}';
    activeRequest.error = true;
    update();
  }
});

screen.key('r', function(ch, key) {
  delete data.chain[data.activeRequest].completed;
  delete data.chain[data.activeRequest].output;
  delete data.chain[data.activeRequest].error;
  update();
});

var update = function() {
  chain.setContent(_(data.chain).map(function(request, index) {
    var color = '';

    if(index === data.activeRequest) {
      color += '{underline}{yellow-fg}';
    }

    if(request.error) {
      color += '{red-fg}';
    } else if(request.completed) {
      color += '{green-fg}';
    } else {
      color += '{blue-fg}';
    }

    return color + request.name + '{/}';
  }).join(' → '));

  // Data output for now
  var activeRequest = data.chain[data.activeRequest];
  var requestContent = '';

  requestContent += '{green-fg}Name{/}: ' + activeRequest.name + '\n';
  requestContent += '{green-fg}Type{/}: ' + activeRequest.type + '\n';

  if (activeRequest.type === 'HTTP') {
    if(activeRequest.http.json) {
      requestContent += '{green-fg}Format{/}: JSON\n';
    }
    requestContent += '\n';
    requestContent += '{green-fg}' + activeRequest.http.method + '{/} ' + activeRequest.http.url + '\n';
    _.each(activeRequest.http.headers, function(value, key) {
      requestContent += '{green-fg}' + key + '{/}: ' + value + '\n';
    });
    requestContent += '\n';
  } else if (activeRequest.type === 'OAUTH') {
    requestContent += '{green-fg}Endpoint{/}: ' + activeRequest.endpoint + '\n';
  } else {
    var requestObject = _.cloneDeep(activeRequest);
    delete requestObject.output;
    requestContent += '\n' + cardinal.highlight(JSON.stringify(requestObject, null, 2), { json: true });
  }

  request.setContent(requestContent);

  if(data.chain[data.activeRequest].output) {
    output.setContent(data.chain[data.activeRequest].output);
  } else {
    output.setContent('');
  }

  screen.render();
};

update();
