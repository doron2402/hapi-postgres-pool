'use strict';
// Node modules
const Pool = require('pg-pool');
const Pg = require('pg');
const Hoek = require('hoek');
const Pkg = require('./package.json');

// Default configurations
const DEFAULT_CONFIGURATION = {
  native: false,
  attach: 'onPreHandler',
  detach: 'stop',
  user: 'postgres',
  password: 'postgres',
  port: 5432,
  host: 'localhost',
  connections: [] // overwrite configuration
};

exports.register = function (server, options, next) {
  // Merge options with default configuration
  let configuration = Hoek.applyToDefaults(DEFAULT_CONFIGURATION, options);
  // Adding logger
  configuration.log = configuration.log || ((msg, data) => server.log(['pg-pool', data], msg));

  if (configuration.native) {
    const NativeClient = Pg.native;
    configuration = Hoek.applyToDefaults({ Client: NativeClient }, configuration);
  }

  const pools = [];
  // Check for number of dbs
  if (Array.isArray(configuration.connections) && configuration.connections.length > 0) {
    // Multiple pools
    configuration.connections.forEach((config, index) => {
      const key = config.key || index;
      pools[key] = new Pool(Hoek.applyToDefaults(configuration, config));
    });
  }
  else {
    // Single pool
    pools[0] = new Pool(configuration);
  }


  server.ext(configuration.attach, (request, reply) => {
    request.pg = [];
    pools.forEach((pool, index) => {
      request.pg[index] = {
        connect: pool.connect.bind(pool),
        query: pool.query.bind(pool),
        on: pool.on.bind(pool)
      };
    });

    reply.continue();
  });

  server.once(configuration.detach, () => {
    server.log(['info', Pkg.name], 'Draining PostgreSQL connection pool...');
    pools.forEach((pool, index) => {
      pool.end(() => {
        server.log(['info', Pkg.name], 'PostgreSQL connection pool drained.');
      });
    });
  });

  next();
};

exports.register.attributes = {
  pkg: Pkg
};
