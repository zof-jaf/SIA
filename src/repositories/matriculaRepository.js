const pool = require('../config/db');

/**
 * Acceso a datos de periodos académicos y matrículas.
 */
class MatriculaRepository {
  /**
   * Crea un periodo académico.
   * @param {object} data Datos del periodo.
   * @returns {Promise<object>} Periodo creado.
   */
  async createPeriod({ nombre, fecha_inicio, fecha_fin, activo }) {
    const query = `
      INSERT INTO periodos_academicos (nombre, fecha_inicio, fecha_fin, activo)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await pool.query(query, [nombre, fecha_inicio, fecha_fin, activo !== undefined ? activo : true]);
    return result.rows[0];
  }

  /**
   * Lista los periodos académicos.
   * @returns {Promise<object[]>} Periodos registrados.
   */
  async getPeriods() {
    const query = `
      SELECT id, nombre, fecha_inicio, fecha_fin, activo
      FROM periodos_academicos
      ORDER BY fecha_inicio DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Obtiene el contexto de una oferta académica para validar matrícula.
   * @param {number|string} ofertaId Identificador de la oferta.
   * @returns {Promise<object | undefined>} Oferta con periodo y estado.
   */
  async getOfferingContext(ofertaId) {
    const query = `
      SELECT
        o.id,
        o.materia_id,
        o.profesor_id,
        o.cupo,
        o.estado,
        o.periodo_id,
        pr.activo AS periodo_activo
      FROM ofertas_materias o
      JOIN periodos_academicos pr ON pr.id = o.periodo_id
      WHERE o.id = $1
    `;
    const result = await pool.query(query, [ofertaId]);
    return result.rows[0];
  }

  /**
   * Cuenta las matrículas activas de una oferta.
   * @param {number|string} ofertaId Identificador de la oferta.
   * @returns {Promise<number>} Total de matriculados activos.
   */
  async countActiveEnrollments(ofertaId) {
    const query = `
      SELECT COUNT(*)::int AS total
      FROM matriculas
      WHERE oferta_materia_id = $1 AND estado = 'ACTIVA'
    `;
    const result = await pool.query(query, [ofertaId]);
    return result.rows[0].total;
  }

  /**
   * Busca una matrícula activa de un estudiante en una oferta.
   * @param {number|string} estudianteId Identificador del estudiante.
   * @param {number|string} ofertaId Identificador de la oferta.
   * @returns {Promise<object | undefined>} Matrícula encontrada.
   */
  async findActiveEnrollment(estudianteId, ofertaId) {
    const query = `
      SELECT id, estudiante_id, oferta_materia_id, estado
      FROM matriculas
      WHERE estudiante_id = $1 AND oferta_materia_id = $2 AND estado = 'ACTIVA'
      LIMIT 1
    `;
    const result = await pool.query(query, [estudianteId, ofertaId]);
    return result.rows[0];
  }

  /**
   * Obtiene el contexto de una matrícula para validar quién puede calificarla.
   * @param {number|string} matriculaId Identificador de la matrícula.
   * @returns {Promise<object | undefined>} Matrícula con oferta y profesor.
   */
  async getMatriculaContext(matriculaId) {
    const query = `
      SELECT
        ma.id,
        ma.estudiante_id,
        ma.estado,
        o.id AS oferta_id,
        o.profesor_id,
        o.periodo_id
      FROM matriculas ma
      JOIN ofertas_materias o ON o.id = ma.oferta_materia_id
      WHERE ma.id = $1
    `;
    const result = await pool.query(query, [matriculaId]);
    return result.rows[0];
  }

  /**
   * Lista las ofertas abiertas del periodo activo y marca si el estudiante
   * ya está matriculado.
   * @param {number|string|null} estudianteId Identificador del estudiante.
   * @returns {Promise<object[]>} Ofertas disponibles.
   */
  async getAvailableOfferings(estudianteId) {
    const query = `
      SELECT
        o.id,
        o.grupo,
        o.cupo,
        o.estado,
        m.id AS materia_id,
        m.codigo,
        m.nombre AS materia,
        m.creditos,
        pr.nombre AS periodo,
        pr.activo AS periodo_activo,
        CASE
          WHEN up.id IS NOT NULL THEN up.nombre || ' ' || up.apellido
          ELSE 'Sin asignar'
        END AS profesor,
        (
          SELECT COUNT(*)::int
          FROM matriculas ma
          WHERE ma.oferta_materia_id = o.id AND ma.estado = 'ACTIVA'
        ) AS estudiantes,
        EXISTS (
          SELECT 1
          FROM matriculas ma
          WHERE ma.oferta_materia_id = o.id
            AND ma.estado = 'ACTIVA'
            AND ma.estudiante_id = $1
        ) AS matriculado,
        (
          SELECT string_agg(
            h.dia_semana || ' ' || to_char(h.hora_inicio, 'HH24:MI') || '-' ||
            to_char(h.hora_fin, 'HH24:MI') || COALESCE(' · ' || h.aula, ''),
            ' / '
          )
          FROM horarios h
          WHERE h.oferta_materia_id = o.id
        ) AS horario
      FROM ofertas_materias o
      JOIN materias m ON m.id = o.materia_id
      JOIN periodos_academicos pr ON pr.id = o.periodo_id
      LEFT JOIN profesores pf ON pf.id = o.profesor_id
      LEFT JOIN usuarios up ON up.id = pf.usuario_id
      WHERE pr.activo = true AND o.estado = 'ABIERTA'
      ORDER BY m.nombre, o.grupo
    `;
    const result = await pool.query(query, [estudianteId || null]);
    return result.rows;
  }

  /**
   * Registra la matrícula directa de un estudiante en una oferta.
   * @param {object} data Identificadores de estudiante y oferta.
   * @returns {Promise<object>} Matrícula creada.
   */
  async createMatricula({ estudiante_id, oferta_materia_id }) {
    const query = `
      INSERT INTO matriculas (estudiante_id, oferta_materia_id, fecha_matricula, estado)
      VALUES ($1, $2, CURRENT_TIMESTAMP, 'ACTIVA')
      RETURNING *;
    `;
    const result = await pool.query(query, [estudiante_id, oferta_materia_id]);
    return result.rows[0];
  }

  /**
   * Consulta las matrículas de un estudiante.
   * @param {number|string} estudiante_id Identificador del estudiante.
   * @returns {Promise<object[]>} Matrículas registradas.
   */
  async getMatriculasByEstudiante(estudiante_id) {
    const query = `
      SELECT id AS matricula_id, estudiante_id, oferta_materia_id, fecha_matricula, estado
      FROM matriculas
      WHERE estudiante_id = $1
      ORDER BY fecha_matricula DESC;
    `;
    const result = await pool.query(query, [estudiante_id]);
    return result.rows;
  }
}

module.exports = new MatriculaRepository();
