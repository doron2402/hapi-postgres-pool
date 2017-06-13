'use strict';
/**
 * Example:
 * Using PG Native client
 * Run `USER=doron PASS=doron HOST=localhost PORT=5433 DB=bla connectionString=psql://....`
 */
const Pool = require('pg-pool');
const Hoek = require('hoek');
const NativeClient = require('pg').native;
const config = [
  {
    user: process.env.USER || 'doron',
    password: process.env.PASS || 'doron',
    host: process.env.HOST || 'localhost',
    port: process.env.PORT || 5432,
    database: process.env.DB || 'db',
    ssl: false,
    key: 'one'
  }, {
    connectionString: process.env.connectionString || 'postgres://psql:psql@localhost:5432/db',
    key: 'two'
  }
];
const dbs = {};
config.forEach((option) => {
  const internalOptions = Hoek.applyToDefaults({ Client: NativeClient.Client }, option);
  dbs[option.key] = new Pool(internalOptions);
});

dbs.one.connect().then((client) => {
  client.query('select * from table_1 limit 1')
  .then((res) => {
    client.release();
    console.log('data: ', res.rows[0]);
    dbs.two.connect().then((client2) => {
      client2.query('select * from table_2 limit 1')
      .then((res2) => {
        console.log(res2.rows[0]);
        client2.release();
        process.exit(0);
      })
      .catch((err2) => {
        console.log(err2);
        client2.release();
        process.exit(1);
      });
    });
  })
  .catch((e) => {
    client.release();
    console.error('query error', e.message, e.stack);
    process.exit(1);
  });
});
