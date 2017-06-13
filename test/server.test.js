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
      if (options.connectionString) {
        t.is(options.user, undefined);
        t.is(options.password, undefined);
        t.is(options.host, undefined);
        t.is(options.port, undefined);
        t.isnot(options.connectionString, undefined);
      }
      else {
        t.is(options.user, 'postgres');
        const portIndex = ports.indexOf(options.port);
        t.notEqual(portIndex, -1);
        ports.splice(portIndex, 1);
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
        },
        {
          connectionString: 'test@test',
          user: 'shouldRemove',
          port: 8000
        }
      ]
    }
  }, (err) => {
    t.is(err, undefined);
    t.is(numberOfPoolBeingCalled, 3);
    t.end();
  });
});
