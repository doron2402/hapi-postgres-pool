'use strict';
const Test = require('tap').test;
const Hapi = require('hapi');
const Proxyquire = require('proxyquire');

Test('Native connection', (t) => {
  t.plan(8);
  let isNativeCalled = false;
  let isSSL = false;
  const stub = {
    pg: {
      native: {
        Client: () => {
          isNativeCalled = true;
        }
      }
    },
    pool: function (options) {
      isNativeCalled = options.Client ? true : false;
      isSSL = options.ssl;
      return { connect: () => {} };
    }
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
      ssl: true,
      attach: 'onPreHandler',
      connections: [
        {
          user: 'postgres',
          password: 'postgres',
          port: 5432,
          host: 'localhost'
        }
      ]
    }
  }, (err) => {
    t.is(err, undefined);
    t.true(isNativeCalled);
    t.true(isSSL);
    t.type(server.plugins['hapi-postgres-pool'], 'object');
    t.type(server.plugins['hapi-postgres-pool'].pg, 'object');
    t.type(server.plugins['hapi-postgres-pool'].pg['0'], 'object');
    t.type(server.plugins['hapi-postgres-pool'].pg._get('1'), 'object');
    t.type(server.plugins['hapi-postgres-pool'].pg._get('1').connect, 'function');
  });
});
