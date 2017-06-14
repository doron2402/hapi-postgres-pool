'use strict';

const Tap = require('tap');
const Hapi = require('hapi');
const Proxyquire = require('proxyquire');
let server;

Tap.test('attach plugin by query & params', (t) => {
  let numberOfPoolBeingCalled = 0;
  const stub = {
    pg: {},
    pool: function (options) {
      numberOfPoolBeingCalled++;
    }
  };

  const Plugin = Proxyquire('../', {
    'pg': stub.pg,
    'pg-pool': stub.pool
  });

  const testPlugin = {
    register: function (_server, options, next) {
      _server.route([{
        method: 'GET',
        path: '/test/{user}',
        handler: (request, reply) => {
          t.test('Make sure plugin is activated', (t) => {
            t.ok(request.pg);
            t.comment('Make sure the plugin is activated');
            t.ok(request.pg.first);
            t.ok(request.pg.second);
            t.end();
          });
          reply({ body: 'success' });
        }
      }, {
        method: 'GET',
        path: '/test',
        handler: (request, reply) => {
          t.test('Plugin should not be attach to request', (t) => {
            t.isEqual(request.pg, undefined);
          });
          reply({ body: 'no plugin attached' });
        }
      }]);
      next();
    }
  };

  testPlugin.register.attributes = {
    name: 'test',
    version: '1.0.0'
  };
  const Server = Hapi.Server;
  server = new Server();
  server.connection({ port: 3000, host: 'localhost' });
  server.register([testPlugin, {
    register: Plugin,
    options: {
      native: true,
      attachedParams: ['user'],
      attach: 'onPreHandler',
      detach: 'tail',
      default: 'second',
      connections: [
        {
          user: 'postgres',
          password: 'postgres',
          port: 5432,
          host: 'localhost',
          key: 'first'
        },
        {
          user: 'postgres',
          password: 'postgres',
          port: 5433,
          host: 'localhost',
          key: 'second'
        },
        {
          connectionString: 'test@test',
          user: 'shouldRemove',
          port: 8000
        }
      ]
    }
  }], (err) => {
    t.is(err, undefined);
    t.is(numberOfPoolBeingCalled, 3);
    t.test('Test handlers', (t) => {
      t.test('Plugin should be available only when query params are passing', (t) => {
        const req = {
          method: 'GET',
          url: '/test/doron'
        };
        server.inject(req, (res) => {
          t.equal(res.result.body, 'success');
          t.equal(res.statusCode, 200);
          t.end();
        });
      });

      t.end();
    });

    t.end();
  });
}).then((t) => {
  t.test('Plugin should NOT be available only when query params are passing', (t) => {
    const req = {
      method: 'GET',
      url: '/test'
    };
    server.inject(req, (res) => {
      t.equal(res.result.body, 'no plugin attached');
      t.equal(res.statusCode, 200);
      t.end();
    });
  });
});
