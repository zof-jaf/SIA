const pool = require('../config/db');

/**
 * Consulta reutilizable que une el trámite con su estudiante y periodo.
 */
const BASE_SELECT = `
  SELECT
    t.id,
    t.estudiante_id,
    t.periodo_id,
    t.tipo_tramite,
    t.estado,
    t.fecha_solicitud,
    t.fecha_resolucion,
    t.detalles,
    e.documento,
    u.nombre,
    u.apellido,
    u.email,
    pr.nombre AS periodo
  FROM tramites t
  JOIN estudiantes e ON e.id = t.estudiante_id
  JOIN usuarios u ON u.id = e.usuario_id
  LEFT JOIN periodos_academicos pr ON pr.id = t.periodo_id
`;

/**
 * Acceso a datos de trámites académicos.
 */
class TramiteRepository {
  /**
   * Lista trámites aplicando filtros opcionales.
   * @param {object} filters Filtros de estudiante, estado y tipo.
   * @returns {Promise<object[]>} Trámites encontrados.
   */
  async findAll({ estudianteId, estado, tipoTramite } = {}) {
    const conditions = [];
    const values = [];

    if (estudianteId) {
      values.push(estudianteId);
      conditions.push(`t.estudiante_id = $${values.length}`);
    }

    if (estado) {
      values.push(estado);
      conditions.push(`t.estado = $${values.length}`);
    }

    if (tipoTramite) {
      values.push(tipoTramite);
      conditions.push(`t.tipo_tramite = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `${BASE_SELECT} ${where} ORDER BY t.fecha_solicitud DESC, t.id DESC`;
    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Busca un trámite por su identificador.
   * @param {number|string} id Identificador del trámite.
   * @returns {Promise<object | undefined>} Trámite encontrado.
   */
  async findById(id) {
    const result = await pool.query(`${BASE_SELECT} WHERE t.id = $1`, [id]);
    return result.rows[0];
  }

  /**
   * Verifica que un estudiante exista.
   * @param {number|string} estudianteId Identificador del estudiante.
   * @returns {Promise<boolean>} `true` cuando existe.
   */
  async studentExists(estudianteId) {
    const result = await pool.query('SELECT 1 FROM estudiantes WHERE id = $1', [estudianteId]);
    return result.rowCount > 0;
  }

  /**
   * Verifica que un periodo académico exista.
   * @param {number|string} periodoId Identificador del periodo.
   * @returns {Promise<boolean>} `true` cuando existe.
   */
  async periodExists(periodoId) {
    const result = await pool.query('SELECT 1 FROM periodos_academicos WHERE id = $1', [periodoId]);
    return result.rowCount > 0;
  }

  /**
   * Registra un trámite académico.
   * @param {object} data Datos validados del trámite.
   * @returns {Promise<object>} Trámite creado con sus relaciones.
   */
  async create({ estudiante_id, periodo_id, tipo_tramite, estado, detalles }) {
    const result = await pool.query(
      `INSERT INTO tramites (estudiante_id, periodo_id, tipo_tramite, estado, detalles)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [estudiante_id, periodo_id || null, tipo_tramite, estado, detalles || null]
    );

    return this.findById(result.rows[0].id);
  }
}

module.exports = new TramiteRepository();
