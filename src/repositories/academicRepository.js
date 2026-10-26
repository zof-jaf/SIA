const pool = require('../config/db');

class AcademicRepository {
  // === PROGRAMAS ACADÉMICOS ===
  async createProgram({ nombre, codigo, descripcion, duracion_semestres }) {
    const query = `
      INSERT INTO programas_academicos (nombre, codigo, descripcion, duracion_semestres, activo)
      VALUES ($1, $2, $3, $4, true)
      RETURNING *;
    `;
    const result = await pool.query(query, [nombre, codigo, descripcion, duracion_semestres]);
    return result.rows[0];
  }

  async getAllPrograms() {
    const query = `SELECT * FROM programas_academicos ORDER BY id ASC;`;
    const result = await pool.query(query);
    return result.rows;
  }

  // === MATERIAS ===
  async createSubject({ nombre, codigo, creditos }) {
    const query = `
      INSERT INTO materias (nombre, codigo, creditos)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await pool.query(query, [nombre, codigo, creditos]);
    return result.rows[0];
  }

  async getAllSubjects() {
    const query = `SELECT * FROM materias ORDER BY id ASC;`;
    const result = await pool.query(query);
    return result.rows;
  }

  // === VINCULAR MATERIA A PROGRAMA ===
  async linkSubjectToProgram({ programa_id, materia_id, semestre }) {
    const query = `
      INSERT INTO programa_materia (programa_id, materia_id, semestre)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await pool.query(query, [programa_id, materia_id, semestre]);
    return result.rows[0];
  }

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
}

module.exports = new AcademicRepository();
