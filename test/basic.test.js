'use strict';

const Test = require('tap').test;
const Pkg = require('../package.json');

Test('paclage version', (t) => {
  t.plan(1);
  t.is('2.0.1', Pkg.version);
});

Test('package name', (t) => {
  t.plan(1);
  t.is('hapi-postgres-pool', Pkg.name);
});
