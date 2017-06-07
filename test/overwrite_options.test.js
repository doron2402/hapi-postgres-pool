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
      else {
        // key is two
        t.is(options.user, 'postgres');
      }
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
      native: false,
      attach: 'onPreHandler',
      detach: 'stop',
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
        }
      ]
    }
  }, (err) => {
    t.is(err, undefined);
    t.is(numberOfPoolBeingCalled, 2);
    t.end();
  });
});
