'use strict';
const Server = require('hapi').Server;
const server = new Server({
  debug: {
    log: ['error', 'warn', 'info', 'pg-pool'],
    request: ['error', 'warn', 'info']
  }
});

server.connection({ port: 3000, host: 'localhost' });

server.register({
  register: require('../'),
  options: {
    native: true,
    attach: 'onPreAuth',
    database: 'postgres',
    user: 'doron',
    password: 'pass123',
    port: 5432,
    ssl: false,
    max: 20,
    min: 1,
    idleTimeoutMillis: 5000,
    connections: [{
      key: '1',
      user: 'doron',
      password: 'pass123',
      host: 'localhost',
      port: 10001,
      database: 'postgres',
      ssl: false
    }, {
      key: '2',
      user: 'doron',
      password: 'pass123',
      host: 'localhost',
      port: 10002,
      database: 'postgres',
      ssl: false
    }]
  }
}, (err) => {
  if (err) {
    throw err;
  }

  server.route([{
    method: 'GET',
    path: '/',
    config: {
      handler: function (request, reply) {
        server.log('info', 'Request started...');
        const queryDB1 = 'select * from pg_stat_activity limit 1';
        request.pg['1'].query(queryDB1)
        .then((result0) => {
          const queryDB2 = 'select * from pg_stat_activity limit 1';
          request.pg['2'].query(queryDB2)
          .then((result1) => {
            return reply({
              results: [result0, result1]
            });
          });
        }).catch((err) => {
          server.log('error', err);
          return reply(err);
        });
      }
    }
  }, {
    method: 'GET',
    path: '/promise',
    config: {
      handler: function (request, reply) {
        const queryDB1 = 'select datid, pid, query from pg_stat_activity limit 1';
        const queryDB2 = 'select pid, datname from pg_stat_activity limit 1';
        Promise.all([
          request.pg['1'].query(queryDB1),
          request.pg['2'].query(queryDB2)
        ])
        .then((results) => {
          return reply({ rows: results });
        }).catch((err) => {
          server.log('error', err);
          return reply(err);
        });
      }
    }
  }]);

  server.start((err) => {
    if (err) {
      return server.log('error', err);
    }
    server.log('info', `Example server started: ${server.info.uri}`);
  });
});
