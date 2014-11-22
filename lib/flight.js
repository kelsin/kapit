#!/usr/bin/env node

process.title = 'flight';

var _ = require('lodash');
var blessed = require('blessed');
var http = require('request');

var data = require('./data');
var edit = require('./edit');
var render = require('./render');

var screen = blessed.screen();

/**
 * ## Widgets
 *
 * This app only needs four widgets on the screen. A message box at the bottom,
 * a step list at the top and then two windows for the request and response.
 *
 * We abstract away our commen [blessed](https://github.com/chjj/blessed)
 * options, create our widgets and then add them to the screen.
 *
 * * **chain**: the top window showing the current chain's list of steps.
 * * **request**: the left window showing the current request.
 * * **response**: the right window showing the current response.
 * * **message**: the message line at the bottom of the app.
 */
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

/**
 * ## Keybindings
 *
 * Here we define all of the keybindings on our app and what they do.
 *
 * * **q**: quit the app.
 * * **n**: go to the next step.
 * * **p**: go to the previous step.
 * * **x**: execute the current step.
 * * **s**: saves the current state of the app.
 * * **c**: creates a new step.
 * * **r**: resets the current step.
 * * **R**: resets all requests in the current chain.
 * * **w**: resets all requests in the current chain.
 *
 * ### Editing
 *
 * * **b**: edits the body of the current step request.
 *
 * ### Viewing
 *
 * * **tab**: switches focues between the left (request) and right (response)
 *   windows.
 *
 * When a request is long enough that you need to scroll you can use VI key
 * bindings to do so:
 *
 * * **j**: move down a line.
 * * **k**: move up a line.
 * * **g**: move to the top of the request/response.
 * * **G**: move to the bottom of the request/response.
 * * **ctrl-d**: move down half a page.
 * * **ctrl-u**: move up half a page.
 */
screen.key('q', function(ch, key) {
  return process.exit(0);
});

screen.key('n', function(ch, key) {
  data.nextStep();
  activateStep();
});

screen.key('p', function(ch, key) {
  data.prevStep();
  activateStep();
});

screen.key('x', function(ch, key) {
  data.resetStep();
  setMessage('{bold}{red-fg}Loading ...{/}');
  updateResponse();
  updateChain();
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

      updateResponse();
      updateChain();
      screen.render();
    });

  } else {
    clearMessage();
    currentStep.response.error = 'Unknown Request Type!';
    updateResponse();
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
  data.newStep();
  updateRequest();
  updateResponse();
  updateChain();
  screen.render();
});

screen.key('r', function(ch, key) {
  data.resetStep();
  updateResponse();
  updateChain();
  screen.render();
});

screen.key('S-r', function(ch, key) {
  data.resetAllSteps();
  updateResponse();
  updateChain();
  screen.render();
});

screen.key('w', function(ch, key) {
  data.toggleRaw();
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
  var text = data.getCurrentStep().request.body || '';
  edit(screen, text).then(function(body) {
    data.resetStep();

    var step = data.getCurrentStep();

    if (body.trim()) {
      step.request.body = body;
    } else {
      delete step.request.body;
    }

    updateRequest();
    updateResponse();
    updateChain();
    screen.render();
  });
});

/**
 * Takes the current step and loads the request and response from previous
 * renders. If there are no previous renders, then create them.
 */
var activateStep = function() {
  var step = data.getCurrentStep();

  if(!step.render.request) {
    step.render.request = render.request(step);
  }
  request.setContent(step.render.request);

  if(!step.render.response) {
    step.render.response = render.response(step);
  }
  response.setContent(step.render.response);

  updateChain();

  screen.render();
};

/**
 * Updates the chain widget with a new render
 */
var updateChain = function() {
  chain.setContent(render.chain());
};

/**
 * Updates the request widget with a new render and caches it
 */
var updateRequest = function() {
  var step = data.getCurrentStep();
  step.render.request = render.request(step);
  request.setContent(step.render.request);
};

/**
 * Updates the response widget with a new render and caches it
 */
var updateResponse = function() {
  var step = data.getCurrentStep();
  step.render.response = render.response(step);
  response.setContent(step.render.response);
};

// Initialize the app by first loading the data file, then updating the screen.
data.load()
  .then(updateRequest)
  .then(updateResponse)
  .then(updateChain)
  .then(function() {
    screen.render();
  })
  .catch(function(e) {
    console.error(e);
    //process.exit(1);
  });
