'use strict';
const Hapi = require('hapi');
const server = new Hapi.Server();
server.connection({ port: 3000, host: 'localhost' });

const pgSettings = {
  native: true,
  default: 'first',
  connections: [
    {
      key: 'first',
      connectionString: 'postgres://doron:pass123@localhost:9987/chronos'
    },
    {
      key: 'second',
      connectionString: 'postgres://doron:pass123@localhost:9988/librejo_sd4'
    }
  ]
};

server.register(
  {
    register: require('../'),
    options: pgSettings
  }, (err) => {
  if (err) {
    console.error('Failed to load plugin:', err);
  }
});

server.route({
  method: 'GET',
  path: '/',
  handler: function (request, reply) {
    request.server.plugins['hapi-postgres-pool'].pg.first.connect()
    // request.pg.first.connect()
    .then((client) => {
      client.query('select * from timeseries limit 1;').then((res) => {
        reply(res);
      }).catch((err) => {
        reply(err);
      });
    }).catch((err) => {
      reply(err);
    });
  }
});

server.start((err) => {
  if (err) {
    throw err;
  }
  console.log(`Server running at: ${server.info.uri}`);
});
