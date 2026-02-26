const { Pool } = require('pg');

const pool = new Pool({
  user: 'cradules',
  host: 'localhost',
  database: 'licenta',
  password: '', 
  port: 5432,
});

module.exports = pool;