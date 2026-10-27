const pool = require('../config/db');

class UserRepository {
  // Buscar usuario por correo con su rol
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

  // 1. Crear Estudiante (Transacción SQL)
async createStudent({ nombre, apellido, email, password_hash, fecha_nacimiento, programa_id, documento, activo }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Inserción en usuarios 
      const userQuery = `
        INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id, activo)
        VALUES ($1, $2, $3, $4, 2, $5)
        RETURNING id, nombre, apellido, email, activo;
      `;
      const userRes = await client.query(userQuery, [nombre, apellido, email, password_hash, activo]);
      const userId = userRes.rows[0].id;

      // Inserción en estudiantes 
      const studentQuery = `
        INSERT INTO estudiantes (usuario_id, fecha_nacimiento, programa_id, documento)
        VALUES ($1, $2, $3, $4)
        RETURNING id, fecha_nacimiento, programa_id, documento;
      `;
      const docVal = documento || `DOC-${Date.now()}`; // Valor por defecto si no se envía
      const studentRes = await client.query(studentQuery, [userId, fecha_nacimiento || null, programa_id || null, docVal]);

      await client.query('COMMIT');

      return {
        ...userRes.rows[0],
        estudiante_id: studentRes.rows[0].id,
        documento: studentRes.rows[0].documento,
        fecha_nacimiento: studentRes.rows[0].fecha_nacimiento,
        programa_id: studentRes.rows[0].programa_id
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async createProfessor({ nombre, apellido, email, password_hash, especialidad, documento, activo }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Inserción en usuarios
      const userQuery = `
        INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id, activo)
        VALUES ($1, $2, $3, $4, 3, $5)
        RETURNING id, nombre, apellido, email, activo;
      `;
      const userRes = await client.query(userQuery, [nombre, apellido, email, password_hash, activo]);
      const userId = userRes.rows[0].id;

      // Inserción en profesores
      const profQuery = `
        INSERT INTO profesores (usuario_id, especialidad, documento)
        VALUES ($1, $2, $3)
        RETURNING id, especialidad, documento;
      `;
      const docVal = documento || `DOC-PROF-${Date.now()}`; // Valor por defecto si no se envía
      const profRes = await client.query(profQuery, [userId, especialidad || 'General', docVal]);

      await client.query('COMMIT');

      return {
        ...userRes.rows[0],
        profesor_id: profRes.rows[0].id,
        documento: profRes.rows[0].documento,
        especialidad: profRes.rows[0].especialidad
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Listar todos los profesores
  async getAllProfessors() {
    const query = `
      SELECT p.id as profesor_id, u.id as usuario_id, u.nombre, u.apellido, u.email, p.documento, u.activo, p.especialidad
      FROM profesores p
      JOIN usuarios u ON p.usuario_id = u.id;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Listar todos los estudiantes
  async getAllStudents() {
    const query = `
      SELECT e.id as estudiante_id, u.id as usuario_id, u.nombre, u.apellido, u.email, u.activo, e.fecha_nacimiento, e.programa_id
      FROM estudiantes e
      JOIN usuarios u ON e.usuario_id = u.id;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Borrado Lógico
  async toggleUserActive(usuario_id, estado) {
    const query = `
      UPDATE usuarios 
      SET activo = $1 
      WHERE id = $2 
      RETURNING id, nombre, apellido, email, activo;
    `;
    const result = await pool.query(query, [estado, usuario_id]);
    return result.rows[0];
  }
}

module.exports = new UserRepository();