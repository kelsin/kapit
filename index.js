#!/usr/bin/env node

process.title = 'Flight';

var _ = require('lodash');
var blessed = require('blessed');

var screen = blessed.screen();

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
  width: '100%',
  height: 3,
  content: 'First → Second'
});

var request = section('Request', {
  width: '50%',
  top: 3,
  bottom: 3
});

var output = section('Output', {
  width: '50%',
  right: 0,
  top: 3,
  bottom: 3
});

screen.append(chain);
screen.append(request);
screen.append(output);

screen.key('q', function(ch, key) {
  return process.exit(0);
});

screen.render();
