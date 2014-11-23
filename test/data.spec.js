'use strict';

var expect = require('chai').expect;

var data = require('../lib/data');

describe('data.js', function() {

  describe('getCurrentChain', function() {

    it('should return null when there is no data', function() {
      expect(data.getCurrentChain()).to.be.null;
    });
  });

  describe('newChain', function() {

    it('should return a new chain', function() {
      var newChain = data.newChain();
      expect(newChain.name).to.equal('New Chain');
    });

    it('should set the new chain as the current chain', function() {
      var newChain = data.newChain();
      expect(data.getCurrentChain()).to.equal(newChain);
    });
  });
});
