'use strict';
/**
 * Simple example using pool client (Not Native)
 */
const Pool = require('pg-pool');

const configDB_A = {
  user: 'doron',
  password: 'pass123',
  host: 'localhost',
  port: 10001,
  database: 'postgres',
  ssl: false
};
const configDB_B = {
  user: 'doron',
  password: 'pass123',
  host: 'localhost',
  port: 10002,
  database: 'postgres',
  ssl: false
};

const poolA = new Pool(configDB_A);
const poolB = new Pool(configDB_B);
const complete = [];
const isComplete = () => {
  complete.push(true);
  if (complete.length >= 2) {
    process.exit(1);
  }
};


poolA.connect().then((client) => {
  client.query('select * from pg_stat_activity limit 1')
  .then((res) => {
    client.release();
    console.log('data: ', res.rows[0]);
    isComplete();
  })
  .catch((e) => {
    client.release();
    console.error('query error', e.message, e.stack);
    process.exit(0);
  });
});

poolB.connect().then((client) => {
  client.query('select * from pg_stat_activity limit 1').then((res) => {
    client.release();
    console.log('data2:', res.rows[0]);
    isComplete();
  })
  .catch((e) => {
    client.release();
    console.error('query error', e.message, e.stack);
    process.exit(0);
  });
});
