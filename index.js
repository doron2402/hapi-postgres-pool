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
  default: 'default',
  connections: [] // overwrite configuration
};

const filterUnderscoreAttr = (x) => x.indexOf('_') === -1;
const _get = function (item) {
  // Look for connection
  if (this[item]) {
    return item;
  }
  // Get default
  if (this._options.default) {
    return this._options.default;
  }
  // get first connection you find
  return Object.keys(this).filter(filterUnderscoreAttr)[0];
};

exports.register = function (server, options, next) {
  // Merge options with default configuration
  let configuration = Hoek.applyToDefaults(DEFAULT_CONFIGURATION, options);
  // Adding logger
  configuration.log = configuration.log || ((msg, data) => server.log(['pg-pool', data], msg));

  if (configuration.native) {
    const NativeClient = Pg.native.Client;
    configuration = Hoek.applyToDefaults({ Client: NativeClient }, configuration);
  }

  const pools = {};
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
    pools[configuration.default] = new Pool(configuration);
  }

  pools._options = { default: configuration.default };
  pools._get = _get;
  // Expose pools
  // server.plugins['hapi-postgres-pool][pg][POOL_NAME].connect().then((client) => {
  //   client.query('SELECT * FROM ...')
  // })...
  server.expose('pg', pools);

  server.ext(configuration.attach, (request, reply) => {
    request.pg = {};
    request._options = { default: configuration.default };
    request.pg._get = _get;
    Promise.all(
      Object.keys(pools)
      .filter(filterUnderscoreAttr)
      .map((key) => pools[key].connect())
    ).then((results) => {
      results.forEach((res, index) => {
        request.pg[Object.keys(pools)[index]] = res;
      });
      reply.continue();
    })
    .catch((err) => {
      server.log(['error', Pkg.name], 'Error connect to postgres');
      server.log(['error', Pkg.name], err);
      reply.continue();
    });
  });

  server.once(configuration.detach, () => {
    server.log(['info', Pkg.name], 'Draining PostgreSQL connections');
    Object.keys(pools).forEach((pool) => {
      pools[pool].end(() => {
        server.log(['info', Pkg.name], `PostgreSQL closing connection to ${pool}`);
      });
    });
  });

  next();
};

exports.register.attributes = {
  pkg: Pkg
};
