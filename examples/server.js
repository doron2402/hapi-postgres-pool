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
    user: 'postgres',
    password: 'postgres',
    port: 5432,
    ssl: false,
    max: 20,
    min: 1,
    idleTimeoutMillis: 5000,
    connections: [{
      key: '1',
      user: 'doron',
      password: 'doron',
      host: 'localhost',
      port: 5432,
      database: 'database_1',
      ssl: false
    }, {
      key: '2',
      user: 'doron2',
      password: 'doron2',
      host: 'localhost',
      port: 5433,
      database: 'database_2',
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
        const queryDB1 = 'select * from SOME_TABLE limit 1';
        request.pg['1'].query(queryDB1)
        .then((result0) => {
          const queryDB2 = 'select * from ANOTHER_TABLE limit 1';
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
        const queryDB1 = 'select * from SOME_TABLE limit 1';
        const queryDB2 = 'select * from ANOTHER_TABLE limit 1';
        Promise.all([
          request.pg['1'].query(queryDB1),
          request.pg['2'].query(queryDB2)
        ])
        .then((results) => {
          return reply({ results });
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
