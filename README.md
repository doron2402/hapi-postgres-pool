# hapi-postgres-pool
Hapi plugin for connecting to multiple PostgreSQL databases
Using Postgres pool connection

[![npm](https://img.shields.io/npm/v/hapi-postgres-pool.svg)](https://www.npmjs.com/package/hapi-postgres-pool)


## Why
I've created this module because I couldn't find any PostgreSQL plugin that can connect to multiple Postgresql db.
I also want to use a module that use a minimum number of dependencies.

### Features:
  - Connect to multiple postgres instances.
  - Attach plugin based query and url parameters `attachedQueries` or/and `attachedParams`
  - Access postgres connections using `server` object or `request`.
  - Support Postgresql native binding.
  - Use pg-pool.
  - Tests

### Run
  - If you looking for a quick working example checkout [this](https://github.com/doron2402/hapi-postgres-pool/blob/2.2.0/examples/server.js)

### Parameters:
+ `options` (Object):
  * `native` (Boolean): using Postgresql native client
    Default: `false`.
  * `user` (String): Postgresql username
  * `password` (String): Postgresql password
  * `port` (Number): Postgresql port number
  * `ssl` (Boolean): SSL on/off
  * `max` (Number): Postgres pool max size
  * `min` (Number): Postgres pool min size
  * `idleTimeoutMillis` (Number): close idle clients after 1 second
  * `database` (String): Database name
  * `attach` (String): Hapi.js events for creating Postgresql connection available (for more info
  check [HAPI life cycle events](https://hapijs.com/api/#request-lifecycle))
    Default: `onPreHandler`
  * `attachedQueries` (Array): Array contain strings of query params, for example when passing
    ['user_id', 'username'] as a query params `?user_id` or `?email=asdf@asdf.com&username=aaa`
    the module will attach the plugin.
  * `attachedParams` (Array): Array contain strings of params same as `attachedQueries` just for
    params. for example if the url is `/users/{username}` and you would like to have the plugin
    available you can pass `attachedParams`:`['username']`.
  * `default` (String): default db name. when using multiple dbs you might want
    to use a config or modulo but when the module can't find any connection it
    will return the default one.
  + `connection` (Array): Array of db connections
    * `key` (String): the database name, this will help you to decide which db
      you would like to access
    * `connectionString` (String): postgres connection string:
      postgres://foo:bar@baz:1234/xur
    * `user` (String): Postgresql username
    * `password` (String): Postgresql password
    * `port` (Number): Postgresql port number
    * `ssl` (Boolean): SSL on/off
    * `max` (Number): Postgres pool max size
    * `min` (Number): Postgres pool min size
    * `idleTimeoutMillis` (Number): close idle clients after 1 second
    * `database` (String): Database name


## Usage
  - There are number of examples under the `examples` directory
```js
/**
* Register the plugin
**/
register: require('hapi-postgres-pool'),
  options: {
    default: 'primary_db',
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
      key: '1', // The key will map request.pg[KEY_HERE].query()... in this case: request.pg['1'].query('SELECT * FROM USERS WHERE...')
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
    }, {
      key: '3',
      connectionString: 'postgres://foo:bar@baz:1234/xur'
    }]
  }
```

```js
/**
* perform queries
* You can also use Promise.all and query in parallel
* IMPORTANT: don't forget to `release` the client after
* fetching the results `client.release()`
**/
method: 'GET',
path: '/promise',
config: {
  handler: function (request, reply) {
    const queryDB1 = 'select * from SOME_TABLE limit 1';
    const queryDB2 = 'select * from ANOTHER_TABLE limit 1';
    const queryDB2 = 'select * from ANOTHER_TABLE_3 limit 1';
    request.server.plugins['hapi-postgres-pool'].pg['1'].connect().
    .then((client1) => {
      client1.query(queryDB1)
      .then((res1) => {
        // Release client1
        client1.release();
        //do something with res1
        request.pg['2'].connect().then((client2) => {
          client2.query(queryDB2)
          .then((res2) => {
            client2.release();
            //do something with res2
            return reply({ res2, res1 });
          }).catch((err2) => {
            console.error(err2);
            return reply(err2);
          });
      }).catch((err1) => {
        console.error(err1);
        return reply(err1);
      })
    });
  }
}
```

## Usage: get connection from plugin
```js
const PgPool = server.plugins['hapi-postgres-pool'].pg;
PgPool._get('first').connect()
.then((client) {
  client.query('SELECT * FROM SOME_TABLE')
  .then((result) => {
    client.release();
    // Do something with the result
  })
  .catch((err) {
    client.release();
    // handle the error...
  });
});
```

## Usage: get specific connection `safe`
```js
const pg =  server.plugins['hapi-postgres-pool'].pg._get('db_1');
pg.connect()
.then((client) =>
  client.query('SELECT SOMEHTING...')
  .then((res) => {
    client.release();
  }).catch((errQuery) => {
    // catch the error
  });
}).catch((err) => {
  // handle error and release pg client
})
```
or using request object
```js
const pg = request.pg._get('db_1');
pg.connect()
.then((client) => {
  client.query('SELECT SOMEHTING...')
  .then((result) {
    // release client and handle results
  }).catch((err) => {
    // handle error and release pg client
  });
});
```
When passing invalid connection name the plugin will use the `default` connection
```
register: require('hapi-postgres-pool'),
  options: {
    default: 'primary_db',
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
      key: '1', // The key will map request.pg[KEY_HERE].query()... in this case: request.pg['1'].query('SELECT * FROM USERS WHERE...')
      user: 'doron',
      password: 'doron',
      ....
 const pg = request.pg._get('invalid_db');
// this will return the default database in this case: 'primary_db'
```


## Questions
  - Checkout the examples
  - Checkout the tests
  - Ping me on twitter or github.
  - [Twitter](twitter.com/segaldoron)
  - [Github](http://github.com/doron2402)

## PR
  - Please do.
