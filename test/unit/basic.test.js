'use strict';

const Test = require('tap').test;
const Pkg = require('../../package.json');
const Plugin = require('../../');

Test('paclage version', (t) => {
  t.plan(1);
  t.is('2.2.3', Pkg.version);
});

Test('package name', (t) => {
  t.plan(1);
  t.is('hapi-postgres-pool', Pkg.name);
});

Test('Plugin', (t) => {
  t.plan(3);
  t.type(Plugin, 'object');
  t.type(Plugin.register.attributes, 'object');
  t.type(Plugin.register, 'function');
});
