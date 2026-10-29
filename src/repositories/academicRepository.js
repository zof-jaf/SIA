const pool = require('../config/db');

/**
 * Acceso a datos del catálogo académico, ofertas y horarios.
 */
class AcademicRepository {
  /**
   * Crea un programa académico.
   * @param {object} data Datos del programa.
   * @returns {Promise<object>} Programa creado.
   */
  async createProgram({ nombre, codigo, descripcion, duracion_semestres }) {
    const query = `
      INSERT INTO programas_academicos (nombre, codigo, descripcion, duracion_semestres, activo)
      VALUES ($1, $2, $3, $4, true)
      RETURNING *;
    `;
    const result = await pool.query(query, [nombre, codigo, descripcion, duracion_semestres]);
    return result.rows[0];
  }

  /**
   * Lista todos los programas académicos.
   * @returns {Promise<object[]>} Programas registrados.
   */
  async getAllPrograms() {
    const query = `SELECT * FROM programas_academicos ORDER BY id ASC;`;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Crea una materia del catálogo.
   * @param {object} data Datos de la materia.
   * @returns {Promise<object>} Materia creada.
   */
  async createSubject({ nombre, codigo, descripcion, creditos, semestre, activo }) {
    const query = `
      INSERT INTO materias (nombre, codigo, descripcion, creditos, semestre, activo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const result = await pool.query(query, [
      nombre,
      codigo,
      descripcion || null,
      creditos,
      semestre || null,
      activo === undefined ? true : Boolean(activo)
    ]);
    return result.rows[0];
  }

  /**
   * Lista todas las materias.
   * @returns {Promise<object[]>} Materias registradas.
   */
  async getAllSubjects() {
    const query = `SELECT * FROM materias ORDER BY id ASC;`;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Vincula una materia a un programa académico.
   * @param {object} data Identificadores y semestre.
   * @returns {Promise<object>} Vínculo creado.
   */
  async linkSubjectToProgram({ programa_id, materia_id, semestre }) {
    const query = `
      INSERT INTO programa_materia (programa_id, materia_id, semestre)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await pool.query(query, [programa_id, materia_id, semestre]);
    return result.rows[0];
  }

  /**
   * Obtiene la malla curricular de un programa.
   * @param {number|string} programa_id Identificador del programa.
   * @returns {Promise<object[]>} Materias de la malla.
   */
  async getCurriculumByProgram(programa_id) {
    const query = `
      SELECT pm.programa_id, pm.materia_id, m.nombre as materia, m.codigo, m.creditos, pm.semestre
      FROM programa_materia pm
      JOIN materias m ON pm.materia_id = m.id
      WHERE pm.programa_id = $1
      ORDER BY pm.semestre ASC;
    `;
    const result = await pool.query(query, [programa_id]);
    return result.rows;
  }

  /**
   * Valida la existencia de materia, profesor y periodo para crear una oferta.
   * @param {object} data Identificadores de la oferta.
   * @returns {Promise<object | undefined>} Contexto de creación.
   */
  async getOfferingCreationContext({ materia_id, profesor_id, periodo_id }) {
    const query = `
      SELECT
        (SELECT nombre FROM materias WHERE id = $1) AS materia,
        (SELECT id FROM profesores WHERE id = $2) AS profesor_id,
        pr.id AS periodo_id,
        pr.nombre AS periodo,
        pr.activo AS periodo_activo
      FROM periodos_academicos pr
      WHERE pr.id = $3
    `;
    const result = await pool.query(query, [materia_id, profesor_id, periodo_id]);
    return result.rows[0];
  }

  /**
   * Crea una oferta académica y sus horarios en una sola transacción.
   * @param {object} data Oferta y horarios a registrar.
   * @returns {Promise<object>} Oferta creada con sus horarios.
   */
  async createOfferingWithSchedules({
    materia_id,
    profesor_id,
    periodo_id,
    grupo,
    cupo,
    estado,
    horarios
  }) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const offeringQuery = `
        INSERT INTO ofertas_materias (materia_id, profesor_id, periodo_id, grupo, cupo, estado)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const offeringRes = await client.query(offeringQuery, [
        materia_id,
        profesor_id,
        periodo_id,
        grupo,
        cupo,
        estado
      ]);
      const offering = offeringRes.rows[0];
      const schedules = [];

      for (const horario of horarios) {
        const scheduleRes = await client.query(
          `INSERT INTO horarios (oferta_materia_id, dia_semana, hora_inicio, hora_fin, aula)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [offering.id, horario.dia_semana, horario.hora_inicio, horario.hora_fin, horario.aula]
        );
        schedules.push(scheduleRes.rows[0]);
      }

      await client.query('COMMIT');
      return { ...offering, horarios: schedules };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new AcademicRepository();
