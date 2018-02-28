'use strict';
/**
 * Example:
 * Using PG Native client
 * Run `USER=doron PASS=doron HOST=localhost PORT=5433 DB=bla connectionString=psql://....`
 */
const { Pool } = require('pg');

const _handleError = (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
};

const config = [
  {
    user: process.env.USER || 'doron',
    password: process.env.PASS || 'pass123',
    host: process.env.HOST || 'localhost',
    port: process.env.PORT || 10001,
    database: process.env.DB || 'db_1',
    ssl: false,
    key: 'one'
  }, {
    user: process.env.USER || 'doron',
    password: process.env.PASS || 'pass123',
    host: process.env.HOST || 'localhost',
    port: process.env.PORT || 10002,
    database: process.env.DB || 'db_2',
    ssl: false,
    key: 'two'
  }
];
const dbs = {};
config.forEach((options) => {
  dbs[options.key] = new Pool(options);
  dbs[options.key].on('error', _handleError);
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
