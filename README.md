Roost
=====================================================================

Roost is an experimental new web-based zephyr client with proper
authentication. This is the official web-based frontend. The backend lives in
the companion roost.git repository. If you only wish to hack on the frontend,
only this repository is needed. By default, it will point against the official
backend deployment.

  https://github.com/davidben/roost

This client is intended to support recent versions of modern browsers. Most
notably, it does not intend to support IE8 and earlier.

Getting started:
  npm install -g bower grunt-cli
  npm install
  bower install

Running dev server:
  grunt server

Building:
  grunt
  # output will go into dist directory

Running server on built files:
  grunt server:dist

Running unit tests:
  grunt test

Change default config by passing command-line arguments to grunt:

  # Point to a different roost backend.
  grunt --server=http://localhost:8080 server
