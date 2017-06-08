'use strict';

const Test = require('tap').test;
const Hapi = require('hapi');
const Proxyquire = require('proxyquire');
const Pkg = require('../package.json');

Test('Two native connections',(t) => {
  const stub = {
    pg: {},
    pool: function (options) {}
  };

  const Plugin = Proxyquire('../', {
    'pg': stub.pg,
    'pg-pool': stub.pool
  });
  const Server = Hapi.Server;
  const server = new Server();
  server.connection({ port: 3000, host: 'localhost' });
  server.register({
    register: Plugin,
    options: {
      native: true,
      attach: 'onPreHandler',
      detach: 'stop',
      connections: [
        {
          user: 'postgres',
          password: 'postgres',
          port: 5432,
          host: 'localhost'
        },
        {
          user: 'postgres',
          password: 'postgres',
          port: 5433,
          host: 'localhost',
          key: 'worker-2'
        }
      ]
    }
  }, (err) => {
    t.is(err, undefined);
    t.type(server.plugins['hapi-postgres-pool'], 'object', 'plugin is exposed');
    t.type(server.plugins['hapi-postgres-pool'].pg, 'object', 'plugin exposed `pg` object');
    t.type(server.plugins['hapi-postgres-pool'].pg['worker-2'], 'object', 'plugin exposed pool connection');
    t.ok(server.plugins['hapi-postgres-pool'].pg['0'], 'set index as key when key is not passed');
    t.end();
  });
});
