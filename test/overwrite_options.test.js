'use strict';

const Test = require('tap').test;
const Hapi = require('hapi');
const Proxyquire = require('proxyquire');


Test('default configurations',(t) => {
  let numberOfPoolBeingCalled = 0;
  const stub = {
    pg: {},
    pool: function (options) {
      numberOfPoolBeingCalled++;
      if (options.key === 'one') {
        t.is(options.port, 8888);
      }
      else if (options.key === 'two') {
        // Should use the "parent" username
        t.is(options.user, 'postgres');
      }
      else if (options.key === 'three') {
        t.is(options.user, undefined);
        t.is(options.connectionString, 'postgres://postgres@localhost:5432/postgres');
      }
    }
  };

  const Plugin = Proxyquire('../', {
    'pg-native': stub.pg,
    'pg-pool': stub.pool
  });
  const Server = Hapi.Server;
  const server = new Server();
  server.connection({ port: 3000, host: 'localhost' });
  server.register({
    register: Plugin,
    options: {
      native: false,
      attach: 'onPreHandler',
      detach: 'stop',
      user: 'postgres',
      port: 8888,
      connections: [
        {
          key: 'one',
          user: 'postgres',
          password: 'postgres',
          host: 'localhost'
        },
        {
          key: 'two',
          password: 'postgres',
          port: 6000,
          host: 'localhost'
        },
        {
          // connectionString should overwrite the other options
          key: 'three',
          connectionString: 'postgres://postgres@localhost:5432/postgres',
          user: 'postgres',
          password: 'postgres'
        }
      ]
    }
  }, (err) => {
    t.is(err, undefined);
    t.is(numberOfPoolBeingCalled, 3);
    t.end();
  });
});
