const { Pool } = require('pg');

const pool = new Pool({
  host: 'db.p.powabase.ai',
  port: 5432,
  database: 'dd63008fda539f8c95d0',
  user: 'dd63008fda539f8c95d0',
  password: 'Blet3aYd3ke7atIIota7Cw31UNdyzkwT',
});

module.exports = pool;