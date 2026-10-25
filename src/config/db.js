require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false 
  }
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error al conectar con la base de datos PostgreSQL:', err.stack);
  } else {
    console.log('Conexión exitosa a la base de datos PostgreSQL en:', res.rows[0].now);
  }
});

module.exports = pool;