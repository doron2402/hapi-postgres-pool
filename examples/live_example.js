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
      connectionString: 'postgres://doron:pass123@localhost:10001/postgres'
    },
    {
      key: 'second',
      connectionString: 'postgres://doron:pass123@localhost:10002/postgres'
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
  }
);

server.route({
  method: 'GET',
  path: '/',
  handler: function (request, reply) {
    request.server.plugins['hapi-postgres-pool'].pg.first
      .connect()
      .then((client) => {
        client.query('select * from pg_stat_activity limit 1;').then((res) => {
          reply(res.rows);
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
