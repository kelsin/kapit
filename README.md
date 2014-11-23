# Kapit

Terminal API Tester with a focus on OAuth and JSON

[![Build Status](http://img.shields.io/travis/kelsin/kapit.svg)](https://travis-ci.org/kelsin/kapit)
[![Code Coverage](http://img.shields.io/codeclimate/coverage/github/kelsin/kapit.svg)](https://codeclimate.com/github/kelsin/kapit)
[![Code Climate](http://img.shields.io/codeclimate/github/kelsin/kapit.svg)](https://codeclimate.com/github/kelsin/kapit)
[![License](http://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/kelsin/kapit/blob/master/LICENSE)
[![Tips](https://img.shields.io/gratipay/kelsin.svg)](https://gratipay.com/kelsin/)

## Installation

First make sure you have a recent version of [node.js](http://nodejs.org/) installed and then run:

    npm install -g kapit

You can then run with:

    kapit

Kapit will use the default config file of `~/.kapit/state.json` but you can pass
another file on the command line if you wish:

    kapit another-file.json

### Webdriver Support

If you want to use PhantomJS or Chrome Webdriver you need to install them. On Mac OSX this can be done with brew:

    brew install phantomjs
    brew install chromedriver

## Development

Checkout and install all dependencies:

    git clone git@github.com:kelsin/kapit.git
    cd kapit
    npm install

You can then run the tests:

    npm test

Or build the documentation:

    groc
