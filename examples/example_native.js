'use strict';
/**
 * Example:
 * Using PG Native client
 */
const Pool = require('pg-pool');
const configDB_A = {
  user: process.env.PG_USERNAME || 'doron',
  password: process.env.PG_PASSWORD || 'pass123',
  host: process.env.HOST || 'localhost',
  port: process.env.PORT || 10001,
  database: 'db_1',
  ssl: false
};

const nativePool = new Pool(configDB_A);

nativePool.connect().then((client) => {
  client.query('select * from pg_stat_activity limit 1')
  .then((res) => {
    client.release();
    console.log('data: ', res.rows[0]);
    process.exit(1);
  })
  .catch((e) => {
    client.release();
    console.error('query error', e.message, e.stack);
    process.exit(0);
  });
});
