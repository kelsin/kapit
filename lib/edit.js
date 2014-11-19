var fs = require('fs');
var osenv = require('osenv');
var temp = require('temp').track();
var Promise = require('bluebird');

Promise.promisifyAll(fs);
Promise.promisifyAll(temp);

module.exports = function(screen, text) {
  Promise.promisifyAll(screen);

  return temp.openAsync({ suffix: '.json' })
    .then(function(info) {
      return fs.writeFileAsync(info.path, text, { mode: 384 }).then(function() { return info; });
    })
    .then(function(info) {
      return screen.execAsync(osenv.editor(), [info.path]).then(function() { return info; });
    })
    .then(function(info) {
      return fs.readFileAsync(info.path, 'utf8');
    })
    .catch(function(err) {
      console.error(err);
      throw err;
    });
};
