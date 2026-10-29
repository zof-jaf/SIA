const pool = require('../config/db');

/**
 * Acceso a datos de calificaciones.
 */
class CalificacionRepository {
  /**
   * Registra una nueva evaluación para una matrícula.
   * @param {object} data Matrícula, nota y observaciones.
   * @returns {Promise<object>} Calificación creada.
   */
  async createOrUpdateCalificacion({ matricula_id, nota, observaciones }) {
    const query = `
      INSERT INTO calificaciones (matricula_id, nota, observaciones, fecha_registro)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const result = await pool.query(query, [matricula_id, nota, observaciones]);
    return result.rows[0];
  }

  /**
   * Obtiene el histórico de calificaciones de un estudiante.
   * @param {number|string} estudiante_id Identificador del estudiante.
   * @returns {Promise<object[]>} Calificaciones con datos de la materia.
   */
  async getCalificacionesByEstudiante(estudiante_id) {
    const query = `
      SELECT
        c.id AS calificacion_id,
        m.id AS matricula_id,
        mat.nombre AS materia,
        mat.codigo AS codigo_materia,
        mat.creditos,
        c.nota,
        c.observaciones,
        c.fecha_registro
      FROM calificaciones c
      JOIN matriculas m ON c.matricula_id = m.id
      JOIN ofertas_materias om ON m.oferta_materia_id = om.id
      JOIN materias mat ON om.materia_id = mat.id
      WHERE m.estudiante_id = $1
      ORDER BY c.fecha_registro DESC;
    `;
    const result = await pool.query(query, [estudiante_id]);
    return result.rows;
  }
}

module.exports = new CalificacionRepository();
