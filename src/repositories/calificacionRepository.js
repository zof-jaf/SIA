const pool = require('../config/db');

class CalificacionRepository {
  // Registrar calificación para una matrícula
  async createOrUpdateCalificacion({ matricula_id, nota, observaciones }) {
    const query = `
      INSERT INTO calificaciones (matricula_id, nota, observaciones, fecha_registro)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const result = await pool.query(query, [matricula_id, nota, observaciones]);
    return result.rows[0];
  }

  // Obtener calificaciones por estudiante
  async getCalificacionesByEstudiante(estudiante_id) {
    const query = `
      SELECT 
        c.id as calificacion_id,
        m.id as matricula_id,
        mat.nombre as materia,
        mat.codigo as codigo_materia,
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
