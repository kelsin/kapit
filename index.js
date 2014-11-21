#!/usr/bin/env node

process.title = 'Flight';

var _ = require('lodash');
var blessed = require('blessed');
var http = require('request');

// Our requires
var data = require('./lib/data');
var edit = require('./lib/edit');
var render = require('./lib/render');

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

var response = section('Response', {
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
  message.setContent('');
};

clearMessage();

screen.append(chain);
screen.append(request);
screen.append(response);
screen.append(message);

screen.key('q', function(ch, key) {
  return process.exit(0);
});

screen.key('n', function(ch, key) {
  data.nextStep();
  updateChain();
  updateRequest();
  updateResponse();
  screen.render();
});

screen.key('p', function(ch, key) {
  data.prevStep();
  updateChain();
  updateRequest();
  updateResponse();
  screen.render();
});

screen.key('x', function(ch, key) {
  data.resetStep();
  setMessage('{bold}{red-fg}Loading ...{/}');
  updateResponse();
  screen.render();

  var currentStep = data.getCurrentStep();

  if(currentStep.type === 'HTTP') {
    http(currentStep.request, function(error, response, body) {
      clearMessage();

      currentStep.response.status = response.statusCode;
      currentStep.response.completed = true;

      if(error || response.statusCode !== 200) {
        currentStep.response.error = true;
      }

      currentStep.response.headers = response.headers;
      currentStep.response.body = body;

      currentStep.render.response = render.response(currentStep);
      updateChain();
      updateResponse();
      screen.render();
    });

  } else {
    clearMessage();
    response.setContent('{red-fg}Unknown type!{/}');
    currentStep.response.error = true;
    updateChain();
    screen.render();
  }
});

screen.key('s', function(ch, key) {
  setMessage('Saving...');
  screen.render();

  data.save().then(function() {
    setMessage('Saved');
    screen.render();
  });
});

screen.key('c', function(ch, key) {
  data.newRequest();
  updateChain();
  updateRequest();
  updateResponse();
  screen.render();
});

screen.key('r', function(ch, key) {
  data.resetStep();
  updateChain();
  updateRequest();
  updateResponse();
  screen.render();
});

screen.key('S-r', function(ch, key) {
  data.resetAllSteps();
  updateRequest();
  screen.render();
});

screen.key('w', function(ch, key) {
  data.toggleRaw();
  var step = data.getCurrentStep();
  step.render = {};
  updateRequest();
  updateResponse();
  screen.render();
});

screen.key('tab', function(ch, key) {
  if(request.focused) {
    response.focus();
  } else {
    request.focus();
  }
});

screen.key('b', function(ch, key) {
  var text = data.getCurrentStep().request.body || '{}';
  edit(screen, text).then(function(body) {
    data.getCurrentStep().request.body = body;
    updateRequest();
    screen.render();
  });
});

var updateChain = function() {
  chain.setContent(render.chain());
};

var updateRequest = function() {
  var step = data.getCurrentStep();
  if(!step.render.request) {
    step.render.request = render.request(step);
  }
  request.setContent(step.render.request);
};

var updateResponse = function() {
  var step = data.getCurrentStep();
  if(step.response.completed) {
    if(!step.render.response) {
      step.render.response = render.response(step);
    }
    response.setContent(step.render.response);
  } else {
    response.setContent();
  }
};

data.load()
  .then(updateChain)
  .then(updateRequest)
  .then(updateResponse)
  .then(function() {
    screen.render();
  })
  .catch(function(e) {
    console.error(e);
    //process.exit(1);
  });
