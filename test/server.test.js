'use strict';

const Test = require('tap').test;
const Hapi = require('hapi');
const Proxyquire = require('proxyquire');


Test('Two native connections',(t) => {
  let numberOfPoolBeingCalled = 0;
  const ports = [5432, 5433];
  const stub = {
    pg: {},
    pool: function (options) {
      numberOfPoolBeingCalled++;
      t.is(options.native, true);
      const portIndex = ports.indexOf(options.port);
      t.notEqual(portIndex, -1);
      ports.splice(portIndex, 1);
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
