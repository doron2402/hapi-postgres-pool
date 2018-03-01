'use strict';

const Test = require('tap').test;
const Hapi = require('hapi');
const Proxyquire = require('proxyquire');

Test('Two native connections',(t) => {
  let numberOfPoolBeingCalled = 0;
  const ports = [5432, 5433];
  const PoolStub = function (options) {
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
  };
  PoolStub.prototype.connect = () => {};

  const stub = {
    pg: {
      native: {
        Pool: PoolStub
      },
      Pool: PoolStub
    }
  };

  const Plugin = Proxyquire('../../', stub);
  const Server = Hapi.Server;
  const server = new Server();
  server.connection({ port: 3000, host: 'localhost' });
  server.register({
    register: Plugin,
    options: {
      native: true,
      attach: 'onPreHandler',
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

Test('Non Native connection', (t) => {
  t.plan(2);
  let isNativeCalled = false;
  const PoolStub = function (options) {
    isNativeCalled = false;
  };
  const NativePoolStub = function (options) {
    isNativeCalled = true;
  };

  PoolStub.prototype.connect = () => {};
  NativePoolStub.prototype.connect = () => {};

  const stub = {
    pg: {
      native: {
        Pool: NativePoolStub
      },
      Pool: PoolStub
    }
  };

  const Plugin = Proxyquire('../../', stub);
  const Server = Hapi.Server;
  const server = new Server();
  server.connection({ port: 3000, host: 'localhost' });
  server.register({
    register: Plugin,
    options: {
      native: false,
      attach: 'onPreHandler',
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
    t.false(isNativeCalled);
  });
});

Test('Native connection', (t) => {
  t.plan(2);
  let isNativeCalled = false;
  const PoolStub = function (options) {
    isNativeCalled = false;
  };
  const NativePoolStub = function (options) {
    isNativeCalled = true;
  };

  PoolStub.prototype.connect = () => {};
  NativePoolStub.prototype.connect = () => {};

  const stub = {
    pg: {
      native: {
        Pool: NativePoolStub
      },
      Pool: PoolStub
    }
  };

  const Plugin = Proxyquire('../../', stub);
  const Server = Hapi.Server;
  const server = new Server();
  server.connection({ port: 3000, host: 'localhost' });
  server.register({
    register: Plugin,
    options: {
      native: true,
      attach: 'onPreHandler',
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
    t.true(isNativeCalled);
  });
});
