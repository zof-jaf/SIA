const pool = require('../config/db');

/**
 * Acceso a datos de usuarios, estudiantes y profesores.
 */
class UserRepository {
  /**
   * Busca un usuario por correo con el nombre de su rol.
   * @param {string} email Correo institucional.
   * @returns {Promise<object | undefined>} Fila encontrada.
   */
  async findByEmail(email) {
    const query = `
      SELECT u.id, u.nombre, u.apellido, u.email, u.password_hash, u.activo, r.nombre AS rol
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.email = $1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  /**
   * Obtiene el perfil mínimo de autorización de un usuario autenticado.
   * @param {number|string} userId Identificador del usuario.
   * @returns {Promise<object | undefined>} Perfil con rol e identificadores de estudiante/profesor.
   */
  async getProfileByUserId(userId) {
    const query = `
      SELECT
        u.id,
        u.activo,
        r.nombre AS rol,
        e.id AS estudiante_id,
        p.id AS profesor_id
      FROM usuarios u
      JOIN roles r ON r.id = u.rol_id
      LEFT JOIN estudiantes e ON e.usuario_id = u.id
      LEFT JOIN profesores p ON p.usuario_id = u.id
      WHERE u.id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Crea un estudiante y su perfil en una transacción.
   * @param {object} data Datos del estudiante.
   * @returns {Promise<object>} Registro creado.
   */
  async createStudent({ nombre, apellido, email, password_hash, fecha_nacimiento, programa_id, documento, activo }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userQuery = `
        INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id, activo)
        VALUES ($1, $2, $3, $4, (SELECT id FROM roles WHERE nombre = 'ESTUDIANTE'), $5)
        RETURNING id, nombre, apellido, email, activo;
      `;
      const userRes = await client.query(userQuery, [nombre, apellido, email, password_hash, activo]);
      const userId = userRes.rows[0].id;

      const studentQuery = `
        INSERT INTO estudiantes (usuario_id, fecha_nacimiento, programa_id, documento)
        VALUES ($1, $2, $3, $4)
        RETURNING id, fecha_nacimiento, programa_id, documento;
      `;
      const docVal = documento || `DOC-${Date.now()}`;
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

  /**
   * Crea un profesor y su perfil en una transacción.
   * @param {object} data Datos del profesor.
   * @returns {Promise<object>} Registro creado.
   */
  async createProfessor({ nombre, apellido, email, password_hash, especialidad, documento, activo }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userQuery = `
        INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id, activo)
        VALUES ($1, $2, $3, $4, (SELECT id FROM roles WHERE nombre = 'PROFESOR'), $5)
        RETURNING id, nombre, apellido, email, activo;
      `;
      const userRes = await client.query(userQuery, [nombre, apellido, email, password_hash, activo]);
      const userId = userRes.rows[0].id;

      const profQuery = `
        INSERT INTO profesores (usuario_id, especialidad, documento)
        VALUES ($1, $2, $3)
        RETURNING id, especialidad, documento;
      `;
      const docVal = documento || `DOC-PROF-${Date.now()}`;
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

  /**
   * Crea un administrador y su perfil en una transacción.
   * @param {object} data Datos del administrador.
   * @returns {Promise<object>} Registro creado.
   */
  async createAdmin({ nombre, apellido, email, password_hash, cargo, activo }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userQuery = `
        INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id, activo)
        VALUES ($1, $2, $3, $4, (SELECT id FROM roles WHERE nombre = 'ADMINISTRADOR'), $5)
        RETURNING id, nombre, apellido, email, activo;
      `;
      const userRes = await client.query(userQuery, [nombre, apellido, email, password_hash, activo]);
      const userId = userRes.rows[0].id;

      const adminQuery = `
        INSERT INTO administradores (usuario_id, cargo)
        VALUES ($1, $2)
        RETURNING id, cargo;
      `;
      const adminRes = await client.query(adminQuery, [userId, cargo || 'Administrador']);

      await client.query('COMMIT');

      return {
        ...userRes.rows[0],
        administrador_id: adminRes.rows[0].id,
        cargo: adminRes.rows[0].cargo
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Lista todos los profesores con sus datos de usuario.
   * @returns {Promise<object[]>} Profesores registrados.
   */
  async getAllProfessors() {
    const query = `
      SELECT p.id AS profesor_id, u.id AS usuario_id, u.nombre, u.apellido, u.email,
             p.documento, u.activo, p.especialidad
      FROM profesores p
      JOIN usuarios u ON p.usuario_id = u.id
      ORDER BY u.apellido, u.nombre;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Lista todos los estudiantes con sus datos de usuario y programa.
   * @returns {Promise<object[]>} Estudiantes registrados.
   */
  async getAllStudents() {
    const query = `
      SELECT e.id AS estudiante_id, u.id AS usuario_id, u.nombre, u.apellido, u.email,
             u.activo, e.fecha_nacimiento, e.programa_id, e.documento
      FROM estudiantes e
      JOIN usuarios u ON e.usuario_id = u.id
      ORDER BY u.apellido, u.nombre;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Activa o desactiva lógicamente un usuario.
   * @param {number|string} usuario_id Identificador del usuario.
   * @param {boolean} estado Nuevo estado.
   * @returns {Promise<object>} Usuario actualizado.
   */
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
