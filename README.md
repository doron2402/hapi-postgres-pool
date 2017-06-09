# hapi-postgres-pool
Hapi plugin for connecting to multiple postgres databases

## Why
I've created this module because I couldn't find postgres plugin that can connect to multiple postgres db.
I also like to use module that use least amount of dependencies.

## Usage

```js
/**
* Register the plugin
**/
register: require('hapi-postgres-pool'),
  options: {
    default: 'primary_db',
    native: true,
    attach: 'onPreAuth',
    detach: 'tail',
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
    }]
  }
```

```js
/**
* perform queries
**/
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
.then((client) => {
  client.query('SELECT SOMEHTING...')
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
    detach: 'tail',
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
