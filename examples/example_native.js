'use strict';
/**
 * Example:
 * Using PG Native client
 */
const Pool = require('pg-pool');
const Hoek = require('hoek');
const NativeClient = require('pg').native;
const configChronosA = {
  user: 'doron',
  password: 'doron',
  host: 'localhost',
  port: 5432,
  database: 'doron',
  ssl: false
};
const options = Hoek.applyToDefaults({ Client: NativeClient }, configChronosA);
const nativePool = new Pool(options);

nativePool.connect().then((client) => {
  client.query('select * from my_fake_table limit 1')
  .then((res) => {
    client.release();
    console.log('data: ', res.rows[0]);
  })
  .catch((e) => {
    client.release();
    console.error('query error', e.message, e.stack);
  });
});
