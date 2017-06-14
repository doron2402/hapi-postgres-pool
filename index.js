'use strict';
// Node modules
const Pool = require('pg-pool');
// const PgNative = require('pg-native');
const PgNative = require('pg').native.Client;
const Hoek = require('hoek');
const Pkg = require('./package.json');

// Default configurations
const DEFAULT_CONFIGURATION = {
  native: false,
  attach: 'onPreHandler',
  detach: 'tail',
  default: 'default',
  min: 4,
  max: 20,
  ssl: false,
  idleTimeoutMillis: 1000,
  connections: [] // overwrite configuration
};

const filterUnderscoreAttr = (x) => x.indexOf('_') === -1;
const intersectArrayWithObjectKeys = (obj, arr) => {
  const tmp = Object.keys(obj).map((val) => {
    return arr.indexOf(val) !== -1;
  }).filter((x) => x === true);
  if (tmp.length === 0) {
    return false;
  }
  return true;
};

const _get = function (item) {
  // Look for connection
  if (this[item]) {
    return this[item];
  }
  // Get default
  if (this._options.default && this[this._options.default]) {
    return this[this._options.default];
  }
  // get first connection you find
  return this[Object.keys(this).filter(filterUnderscoreAttr)[0]];
};

exports.register = function (server, options, next) {
  // Merge options with default configuration
  let configuration = Hoek.applyToDefaults(DEFAULT_CONFIGURATION, options);
  // Adding logger
  configuration.log = configuration.log || ((msg, data) => server.log(['pg-pool', data], msg));

  if (configuration.native) {
    configuration = Hoek.applyToDefaults({ Client: PgNative }, configuration);
  }

  const pools = {};
  // Check for number of dbs
  if (Array.isArray(configuration.connections) && configuration.connections.length > 0) {
    // Multiple pools
    configuration.connections.forEach((config, index) => {
      const key = config.key || index;
      const internalOptions = {};
      const { host, port, user, password, Client, ssl,
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
      // Check for native client
      if (Client) {
        internalOptions.Client = Client;
      }

      internalOptions.ssl = ssl;
      internalOptions.min = min;
      internalOptions.max = max;
      internalOptions.idleTimeoutMillis = idleTimeoutMillis;

      pools[key] = new Pool(internalOptions);
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

  server.once(configuration.detach, () => {
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
