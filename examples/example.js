'use strict';
/**
 * Simple example using pool client (Not Native)
 */
const Pool = require('pg-pool');

const configDB_A = {
  user: 'doron',
  password: 'doron',
  host: 'localhost',
  port: 5432,
  database: 'db1',
  ssl: false
};
const configDB_B = {
  user: 'doron',
  password: 'doron',
  host: 'localhost',
  port: 5433,
  database: 'db2',
  ssl: false
};

const poolA = new Pool(configDB_A);
const poolB = new Pool(configDB_B);

poolA.connect().then((client) => {
  client.query('select * from my_table limit 1')
  .then((res) => {
    client.release();
    console.log('data: ', res.rows[0]);
  })
  .catch((e) => {
    client.release();
    console.error('query error', e.message, e.stack);
  });
});

poolB.connect().then((client) => {
  client.query('select * from my_table limit 1').then((res) => {
    client.release();
    console.log('data2:', res.rows[0]);
  })
  .catch((e) => {
    client.release();
    console.error('query error', e.message, e.stack);
  });
});
