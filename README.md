# Kapit

Terminal API Tester with a focus on OAuth and JSON

[![Build Status](http://img.shields.io/travis/kelsin/kapit.svg)](https://travis-ci.org/kelsin/kapit)
[![Code Coverage](http://img.shields.io/codeclimate/coverage/github/kelsin/kapit.svg)](https://codeclimate.com/github/kelsin/kapit)
[![Code Climate](http://img.shields.io/codeclimate/github/kelsin/kapit.svg)](https://codeclimate.com/github/kelsin/kapit)
[![License](http://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/kelsin/kapit/blob/master/LICENSE)
[![Tips](https://img.shields.io/gratipay/kelsin.svg)](https://gratipay.com/kelsin/)

Kapit is a program that runs in your terminal and allows you to run HTTP
commands. While not nearly as full featured as (curl)[http://curl.haxx.se/] or
libraries (like (request)[https://github.com/request/request]) it has a few
features that I felt the other API testing programs were lacking.

### Reasons

* I wanted a client that saved all state so I can launch it later and have all
of my inputs and outputs the same as when I left.
* I wanted to include (Paw)[https://luckymarmot.com/paw]'s feature of using
parts of other requests in new requests.
* I wanted to setup a chain of requests that all build on one another.
* I wanted to include
  (Webdriver)[http://docs.seleniumhq.org/projects/webdriver/] support so we can
  handle fancy OAuth 2.0 flows that require browser use.
* I'm not afraid of using my (favorite
  editor)[http://www.gnu.org/software/emacs/] to edit JSON. I'm ok editing
  request bodies like this, and using this for many advanced options.
* I wanted simple options to be accessible with single key presses.

### Alternatives

* (Postman)[http://www.getpostman.com/] - Chrome Extension
* (Paw)[https://luckymarmot.com/paw] - Mac Desktop App
* (curl)[http://curl.haxx.se/] - Command line tool

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

## Usage

## Development

Checkout and install all dependencies:

    git clone git@github.com:kelsin/kapit.git
    cd kapit
    npm install

You can then run the tests:

    npm test

Or build the documentation:

    groc
