'use strict';
/**
 * Example:
 * Using PG Native client
 * Run `USER=doron PASS=doron HOST=localhost PORT=5433 DB=bla connectionString=psql://....`
 */
const { Pool } = require('pg').native;

const _handleError = (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
};

const config = [
  {
    user: process.env.PG1_USERNAME || 'doron',
    password: process.env.PG1_PASSWORD || 'pass123',
    host: process.env.HOST || 'localhost',
    port: process.env.PG1_PORT || 10001,
    database: process.env.PG1_DB || 'db_1',
    ssl: false,
    key: 'one'
  }, {
    user: process.env.PG2_USERNAME || 'doron',
    password: process.env.PG2_PASSWORD || 'pass123',
    host: process.env.HOST || 'localhost',
    port: process.env.PG2_PORT || 10002,
    database: process.env.PG2_DB || 'db_2',
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
  return client
    .query('select * from pg_stat_activity limit $1', [1])
    .then((res) => {
      client.release();
      console.log('data: ', res.rows[0]);
      dbs.two.connect().then((client2) => {
        return client2.query('select * from pg_stat_activity limit 1')
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

process.on('unhandledRejection', (err) => {
  console.log(err);
});
