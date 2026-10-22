const pool = require('../config/db');

class UserRepository {
  // Buscar un usuario por su correo electrónico
  async findByEmail(email) {
    const query = `
      SELECT u.id, u.nombre, u.apellido, u.email, u.password_hash, u.activo, r.nombre as rol
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.email = $1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  // Crear un nuevo usuario en el sistema
  async createUser(nombre, apellido, email, passwordHash, rolId) {
    const query = `
      INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id, activo)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id, nombre, apellido, email, rol_id, activo
    `;
    const result = await pool.query(query, [nombre, apellido, email, passwordHash, rolId]);
    return result.rows[0];
  }
}

module.exports = new UserRepository();