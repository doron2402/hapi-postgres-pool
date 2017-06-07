# hapi-postgres-pool
Hapi plugin for connecting to multiple postgres databases

## Why
I've created this module because I couldn't find postgres plugin that can connect to multiple postgres db.
I also like to use module that use least amount of dependencies.

## how to use:

1. `npm install`
2. Register the plugin
```
register: require('../'),
  options: {
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

### When you need to perform a query for multiple dbs you can use:
```
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


## Questions
  - Checkout the examples
  - Checkout the tests
  - Ping me on twitter or github.
  - [Twitter](twitter.com/segaldoron)
  - [Github](http://github.com/doron2402)