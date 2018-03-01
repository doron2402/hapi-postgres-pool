'use strict';

const Tap = require('tap');
const Hapi = require('hapi');
const Proxyquire = require('proxyquire');
const { PoolStub } = require('./stubs');
let server;

const routePlugin = {
  register: function (_server, options, next) {
    _server.route([{
      method: 'GET',
      path: '/test/{user}',
      handler: (request, reply) => {
        return reply({
          pg: request.pg,
          query: request.query,
          params: request.params
        });
      }
    }, {
      method: 'GET',
      path: '/test',
      handler: (request, reply) => {
        return reply({
          pg: request.pg,
          query: request.query,
          params: request.params
        });
      }
    }]);
    next();
  }
};

routePlugin.register.attributes = {
  name: 'route-test',
  version: '1.0.0'
};

Tap.beforeEach((next) => {
  const Server = Hapi.Server;
  server = new Server();
  server.connection({ port: 0 });
  next();
});

Tap.test('attach plugin by params `user`', (t) => {
  t.plan(17);

  const stub = {
    pg: {
      Pool: PoolStub,
      native: {
        Pool: PoolStub
      }
    }
  };
  const pluginOptions = {
    native: true,
    attachedParams: ['user'],
    attachedQueries: ['user'],
    attach: 'onPreHandler',
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
  };
  const Plugin = Proxyquire('../', {
    'pg': stub.pg
  });
  server.register([routePlugin, { register: Plugin, options: pluginOptions }], (err) => {
    t.isEqual(err, undefined);
    const req = {
      method: 'GET',
      url: '/test/testparam'
    };
    server.inject(req, (res) => {
      t.isEqual(res.result.params.user, 'testparam');
      t.type(res.result.pg, 'object');
      t.type(res.result.pg.first, 'object');
      t.type(res.result.pg.second, 'object');
      t.comment('Plugin will assign key when key is not assign');
      t.type(res.result.pg[2], 'object');
    });

    const req2 = {
      method: 'GET',
      url: '/test'
    };
    server.inject(req2, (res) => {
      t.deepEqual(res.result.params, {});
      t.type(res.result.pg, undefined);
    });
    // Check query params
    const req3 = {
      method: 'GET',
      url: '/test?user=test'
    };
    server.inject(req3, (res) => {
      t.deepEqual(res.result.params, {});
      t.deepEqual(res.result.query, { user: 'test' });
      t.type(res.result.pg, 'object');
      t.type(res.result.pg.first, 'object');
      t.type(res.result.pg.second, 'object');
      t.comment('Plugin will assign key when key is not assign');
      t.type(res.result.pg[2], 'object');
    });

    // Without query params or query in url
    const req4 = {
      method: 'GET',
      url: '/test'
    };
    server.inject(req4, (res) => {
      t.deepEqual(res.result.params, {});
      t.deepEqual(res.result.query, {});
      t.type(res.result.pg, undefined);
    });
  });
});
