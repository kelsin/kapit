var _ = require('lodash');
var blessed = require('blessed');

exports.modal = function(text, options) {
  return blessed.box(_.merge({
    padding: {
      left: 1,
      right: 1
    },
    top: 'center',
    left: 'center',
    tags: true,
    shrink: true,
    hidden: true,
    label: text,
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
  }, (options || {})));
};

exports.section = function(text, options) {
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
  }, (options || {})));
};

exports.message = function(options) {
  return blessed.box(_.merge({
    padding: {
      left: 1,
      right: 1
    },
    width: '100%',
    height: 1,
    bottom: 1,
    content: '',
    tags: true
  }, (options || {})));
};
