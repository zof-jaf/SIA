const pool = require('../config/db');

class MatriculaRepository {
  // Registrar matrícula directa de un estudiante a una materia ofertada
  async createMatricula({ estudiante_id, oferta_materia_id }) {
    const query = `
      INSERT INTO matriculas (estudiante_id, oferta_materia_id, fecha_matricula, estado)
      VALUES ($1, $2, CURRENT_TIMESTAMP, 'ACTIVA')
      RETURNING *;
    `;
    const result = await pool.query(query, [estudiante_id, oferta_materia_id]);
    return result.rows[0];
  }

  // Consultar las materias en las que está matriculado un estudiante
  async getMatriculasByEstudiante(estudiante_id) {
    const query = `
      SELECT m.id as matricula_id, m.estudiante_id, m.oferta_materia_id, m.fecha_matricula, m.estado
      FROM matriculas m
      WHERE m.estudiante_id = $1;
    `;
    const result = await pool.query(query, [estudiante_id]);
    return result.rows;
  }
}

module.exports = new MatriculaRepository();
