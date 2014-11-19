#!/usr/bin/env node

process.title = 'Flight';

var _ = require('lodash');
var blessed = require('blessed');
var cardinal = require('cardinal');
var http = require('request');

// Our requires
var data = require('./lib/data');
var edit = require('./lib/edit');

var screen = blessed.screen();

var section = function(text, options) {
  return blessed.box(_.merge({
    padding: {
      left: 1,
      right: 1
    },
    label: text,
    tags: true,
    border: {
      type: 'line',
      fg: 'black'
    },
    style: {
      label: {
        fg: 'magenta'
      },
      focus: {
        border: {
          fg: 'magenta',
          bold: true
        }
      }
    }
  }, options));
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
  bottom: 2,
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  vi: true
});

var output = section('Output', {
  width: '50%',
  right: 0,
  top: 3,
  bottom: 2,
  focused: true,
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  vi: true
});

var message = blessed.text({
  padding: {
    left: 1,
    right: 1
  },
  width: '100%',
  height: 1,
  bottom: 1,
  content: '',
  tags: true
});

var setMessage = function(msg) {
  message.setContent(msg);
};

var clearMessage = function() {
  message.setContent();
};

screen.append(chain);
screen.append(request);
screen.append(output);
screen.append(message);

screen.key('q', function(ch, key) {
  return process.exit(0);
});

screen.key('n', function(ch, key) {
  data.nextRequest();
  update();
});

screen.key('p', function(ch, key) {
  data.prevRequest();
  update();
});

screen.key('x', function(ch, key) {
  var activeRequest = data.getCurrentRequest();

  setMessage('{bold}{red-fg}Loading ...{/}');
  //activeRequest.output = '{bold}{red-fg}Loading ...{/}';
  update();

  if(activeRequest.type === 'HTTP') {
    http(activeRequest.http, function(error, response, body) {
      clearMessage();

      if(error || response.statusCode !== 200) {
        activeRequest.error = true;
      } else {
        activeRequest.completed = true;
      }

      // Output Status
      var result = '{yellow-fg}status{/}: ';
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

screen.key('s', function(ch, key) {
  setMessage('Saving...');
  update();

  data.save().then(function() {
    setMessage('Saved');
    update();
  });
});

screen.key('c', function(ch, key) {
  data.newRequest();
  update();
});

screen.key('r', function(ch, key) {
  data.resetRequest();
  update();
});

screen.key('S-r', function(ch, key) {
  data.resetAllRequests();
  update();
});

screen.key('tab', function(ch, key) {
  if(request.focused) {
    output.focus();
  } else {
    request.focus();
  }
});

screen.key('b', function(ch, key) {
  var text = data.getCurrentRequest().body || '{}';
  edit(screen, text).then(function(body) {
    data.getCurrentRequest().body = body;
    update();
  });
});

var update = function() {
  chain.setContent(_(data.getCurrentRequests()).map(function(request, index) {
    var color = '';

    if(index === data.getCurrentChain().current) {
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
  var activeRequest = data.getCurrentRequest();
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
    requestContent += cardinal.highlight(JSON.stringify(JSON.parse(activeRequest.body || '{}'), null, 2), { json: true });
  } else if (activeRequest.type === 'OAUTH') {
    requestContent += '{green-fg}Endpoint{/}: ' + activeRequest.endpoint + '\n';
  } else {
    var requestObject = _.cloneDeep(activeRequest);
    delete requestObject.output;
    requestContent += '\n' + cardinal.highlight(JSON.stringify(requestObject, null, 2), { json: true });
  }

  request.setContent(requestContent);

  if(data.getCurrentRequest().output) {
    output.setContent(data.getCurrentRequest().output);
  } else {
    output.setContent('');
  }

  screen.render();
  data.save();
};

data.load()
  .then(update)
  .catch(function(e) {
    //console.error(e);
    //process.exit(1);
  });
