'use strict';
// Node modules
let { Pool } = require('pg');
const Hoek = require('hoek');
const Pkg = require('./package.json');
const {
  filterUnderscoreAttr,
  intersectArrayWithObjectKeys,
  _get
} = require('./helpers');

// Default configurations
/**
 * By default the module:
 *  - Will not use postgresql native binding
 *  - Attach the plugin on `onPreHandler`
*/
const DEFAULT_CONFIGURATION = {
  native: false,
  attach: 'onPreHandler',
  default: 'default',
  min: 4,
  max: 20,
  ssl: false,
  idleTimeoutMillis: 1000,
  connections: [] // overwrite configuration
};

exports.register = function (server, options, next) {
  // Merge options with default configuration
  const configuration = Hoek.applyToDefaults(DEFAULT_CONFIGURATION, options);
  // Adding logger
  configuration.log = configuration.log || ((msg, data) => server.log(['pg-pool', data], msg));

  const pools = {};
  // Check for number of dbs
  if (Array.isArray(configuration.connections) && configuration.connections.length > 0) {
    // Multiple pools
    configuration.connections.forEach((config, index) => {
      const key = config.key || index;
      const internalOptions = {};
      const { host, port, user, password, ssl,
        min, max, idleTimeoutMillis, database
      } = Hoek.applyToDefaults(configuration, config);
      if (config.connectionString) {
        internalOptions.connectionString = config.connectionString;
      }
      else {
        internalOptions.host = host;
        internalOptions.port = port;
        internalOptions.user = user;
        internalOptions.password = password;
        internalOptions.database = database;
      }
      internalOptions.ssl = ssl;
      internalOptions.min = min;
      internalOptions.max = max;
      internalOptions.idleTimeoutMillis = idleTimeoutMillis;
      // Check if it should use native binding
      if (configuration.native === true) {
        Pool = require('pg').native.Pool;
      }
      pools[key] = new Pool(internalOptions);
    });
  }
  else {
    // Single pool
    if (configuration.native === true) {
      Pool = require('pg').native.Pool;
    }
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
    // Attach only when needed by query or params
    const { attachedQueries = [], attachedParams = [] } = configuration;
    if (attachedQueries.length > 0 || attachedParams.length > 0) {
      // Lookup params values
      const matchedParams = intersectArrayWithObjectKeys(request.params, attachedParams);
      const matchedQueries = intersectArrayWithObjectKeys(request.query, attachedQueries);
      // Dont attach db connection
      if (!matchedParams && !matchedQueries) {
        return reply.continue();
      }
    }
    request.pg = {
      _options: { default: configuration.default },
      _get
    };

    Object.keys(pools)
    .filter(filterUnderscoreAttr)
    .forEach((key) => {
      request.pg[key] = pools[key];
    });
    reply.continue();
  });
  /**
   * Closing Pool once server stop
   */
  server.once('stop', () => {
    server.log(['info', Pkg.name], 'Draining PostgreSQL connections');
    Object.keys(pools)
    .filter(filterUnderscoreAttr)
    .forEach((pool) => {
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
