const { Pool } = require('pg');

const pool = new Pool({
  user: 'cradules',
  host: 'localhost',
  database: 'licenta',
  password: '',
  port: 5432,
});

pool.query("SET client_encoding TO 'UTF8'");
module.exports = pool;
