#!/usr/bin/env node

var blessed = require('blessed');

var screen = blessed.screen();

screen.key('q', function(ch, key) {
  return process.exit(0);
});

screen.render();
