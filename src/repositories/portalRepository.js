const pool = require('../config/db');

class PortalRepository {
  async getUserProfile(userId) {
    const query = `
      SELECT
        u.id, u.nombre, u.apellido, u.email, u.activo, r.nombre AS rol,
        e.id AS estudiante_id, COALESCE(e.documento, p.documento) AS documento, e.telefono, e.programa_id,
        pa.nombre AS programa, pa.codigo AS programa_codigo, pa.duracion_semestres,
        p.id AS profesor_id, p.especialidad, p.telefono AS profesor_telefono
      FROM usuarios u
      JOIN roles r ON r.id = u.rol_id
      LEFT JOIN estudiantes e ON e.usuario_id = u.id
      LEFT JOIN programas_academicos pa ON pa.id = e.programa_id
      LEFT JOIN profesores p ON p.usuario_id = u.id
      WHERE u.id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  async getActivePeriod() {
    const result = await pool.query(
      `SELECT id, nombre, fecha_inicio, fecha_fin, activo
       FROM periodos_academicos
       WHERE activo = true
       ORDER BY fecha_inicio DESC
       LIMIT 1`
    );
    return result.rows[0];
  }

  async getStudentEnrollments(estudianteId) {
    const query = `
      SELECT
        ma.id AS matricula_id, ma.estado AS matricula_estado, ma.fecha_matricula,
        m.id AS materia_id, m.codigo, m.nombre AS materia, m.creditos,
        o.id AS oferta_id, o.grupo, o.cupo,
        pr.id AS periodo_id, pr.nombre AS periodo, pr.activo AS periodo_activo,
        pf.id AS profesor_id,
        CASE WHEN up.id IS NOT NULL THEN up.nombre || ' ' || up.apellido ELSE NULL END AS profesor,
        (
          SELECT json_agg(json_build_object(
            'dia', h.dia_semana,
            'inicio', to_char(h.hora_inicio, 'HH24:MI'),
            'fin', to_char(h.hora_fin, 'HH24:MI'),
            'aula', h.aula
          ) ORDER BY h.dia_semana, h.hora_inicio)
          FROM horarios h
          WHERE h.oferta_materia_id = o.id
        ) AS horarios,
        c.nota, c.observaciones, c.fecha_registro
      FROM matriculas ma
      JOIN ofertas_materias o ON o.id = ma.oferta_materia_id
      JOIN materias m ON m.id = o.materia_id
      JOIN periodos_academicos pr ON pr.id = o.periodo_id
      LEFT JOIN profesores pf ON pf.id = o.profesor_id
      LEFT JOIN usuarios up ON up.id = pf.usuario_id
      LEFT JOIN LATERAL (
        SELECT nota, observaciones, fecha_registro
        FROM calificaciones
        WHERE matricula_id = ma.id
        ORDER BY fecha_registro DESC, id DESC
        LIMIT 1
      ) c ON true
      WHERE ma.estudiante_id = $1
      ORDER BY pr.activo DESC, m.nombre
    `;
    const result = await pool.query(query, [estudianteId]);
    return result.rows;
  }

  async getStudentGrades(estudianteId) {
    const query = `
      SELECT
        m.id AS materia_id, m.codigo, m.nombre AS materia, m.creditos,
        pr.id AS periodo_id, pr.nombre AS periodo, pr.activo AS periodo_activo,
        MAX(c.nota) AS nota,
        COUNT(c.id) AS evaluaciones,
        MAX(c.fecha_registro) AS fecha_registro,
        (
          ARRAY_AGG(c.observaciones ORDER BY c.fecha_registro DESC NULLS LAST, c.id DESC)
          FILTER (WHERE c.observaciones IS NOT NULL)
        )[1] AS observaciones
      FROM matriculas ma
      JOIN ofertas_materias o ON o.id = ma.oferta_materia_id
      JOIN materias m ON m.id = o.materia_id
      JOIN periodos_academicos pr ON pr.id = o.periodo_id
      JOIN calificaciones c ON c.matricula_id = ma.id
      WHERE ma.estudiante_id = $1
      GROUP BY m.id, m.codigo, m.nombre, m.creditos, pr.id, pr.nombre, pr.activo, pr.fecha_inicio
      ORDER BY pr.fecha_inicio DESC, m.nombre
    `;
    const result = await pool.query(query, [estudianteId]);
    return result.rows;
  }

  async getProgramCurriculum(programaId) {
    const query = `
      SELECT m.id AS materia_id, m.codigo, m.nombre AS materia, m.creditos, pm.semestre, pm.obligatoria
      FROM programa_materia pm
      JOIN materias m ON m.id = pm.materia_id
      WHERE pm.programa_id = $1
      ORDER BY pm.semestre, m.nombre
    `;
    const result = await pool.query(query, [programaId]);
    return result.rows;
  }

  async getProfessorOfferings(profesorId) {
    const query = `
      SELECT
        o.id, o.grupo, o.cupo, o.estado,
        m.id AS materia_id, m.codigo, m.nombre AS materia, m.creditos,
        pr.nombre AS periodo, pr.activo AS periodo_activo,
        (
          SELECT COUNT(DISTINCT ma.estudiante_id)
          FROM matriculas ma
          WHERE ma.oferta_materia_id = o.id AND ma.estado = 'ACTIVA'
        ) AS estudiantes,
        (
          SELECT COUNT(c.id)
          FROM calificaciones c
          JOIN matriculas ma ON ma.id = c.matricula_id
          WHERE ma.oferta_materia_id = o.id
        ) AS calificados,
        (
          SELECT ROUND(AVG(c.nota), 2)
          FROM calificaciones c
          JOIN matriculas ma ON ma.id = c.matricula_id
          WHERE ma.oferta_materia_id = o.id
        ) AS promedio,
        (
          SELECT string_agg(DISTINCT
            h.dia_semana || ' ' || to_char(h.hora_inicio, 'HH24:MI') || '-' ||
            to_char(h.hora_fin, 'HH24:MI') || COALESCE(' · ' || h.aula, ''), ' / ')
          FROM horarios h
          WHERE h.oferta_materia_id = o.id
        ) AS horario,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'dia', h.dia_semana,
              'inicio', to_char(h.hora_inicio, 'HH24:MI'),
              'fin', to_char(h.hora_fin, 'HH24:MI'),
              'aula', COALESCE(h.aula, 'Sin aula')
            )
            ORDER BY h.dia_semana, h.hora_inicio
          )
          FROM horarios h
          WHERE h.oferta_materia_id = o.id
        ), '[]'::json) AS horarios
      FROM ofertas_materias o
      JOIN materias m ON m.id = o.materia_id
      JOIN periodos_academicos pr ON pr.id = o.periodo_id
      WHERE o.profesor_id = $1
      ORDER BY pr.activo DESC, m.nombre, o.grupo
    `;
    const result = await pool.query(query, [profesorId]);
    return result.rows;
  }

  async getOfferingStudents(profesorId, ofertaId) {
    const ownership = await pool.query(
      'SELECT id FROM ofertas_materias WHERE id = $1 AND profesor_id = $2',
      [ofertaId, profesorId]
    );

    if (ownership.rows.length === 0) return null;

    const query = `
      SELECT DISTINCT ON (e.id)
        ma.id AS matricula_id, ma.estado AS matricula_estado,
        e.id AS estudiante_id, e.documento,
        u.nombre, u.apellido, u.email,
        c.nota, c.observaciones, c.fecha_registro
      FROM matriculas ma
      JOIN estudiantes e ON e.id = ma.estudiante_id
      JOIN usuarios u ON u.id = e.usuario_id
      LEFT JOIN LATERAL (
        SELECT nota, observaciones, fecha_registro
        FROM calificaciones
        WHERE matricula_id = ma.id
        ORDER BY fecha_registro DESC, id DESC
        LIMIT 1
      ) c ON true
      WHERE ma.oferta_materia_id = $1 AND ma.estado = 'ACTIVA'
      ORDER BY e.id, ma.fecha_matricula DESC, ma.id DESC
    `;

    const result = await pool.query(query, [ofertaId]);
    return result.rows.sort((a, b) =>
      `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`)
    );
  }

  async getAdminStats() {
    const [
      usuarios,
      estudiantes,
      profesores,
      administradores,
      activos,
      programas,
      materias,
      periodos,
      ofertas,
      matriculas
    ] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS total FROM usuarios'),
      pool.query('SELECT COUNT(*)::int AS total FROM estudiantes'),
      pool.query('SELECT COUNT(*)::int AS total FROM profesores'),
      pool.query("SELECT COUNT(*)::int AS total FROM usuarios u JOIN roles r ON r.id = u.rol_id WHERE r.nombre = 'ADMINISTRADOR'"),
      pool.query('SELECT COUNT(*)::int AS total FROM usuarios WHERE activo = true'),
      pool.query('SELECT COUNT(*)::int AS total FROM programas_academicos WHERE activo = true'),
      pool.query('SELECT COUNT(*)::int AS total FROM materias WHERE activo = true'),
      pool.query('SELECT COUNT(*)::int AS total FROM periodos_academicos WHERE activo = true'),
      pool.query('SELECT COUNT(*)::int AS total FROM ofertas_materias'),
      pool.query('SELECT COUNT(*)::int AS total FROM matriculas')
    ]);

    return {
      usuarios: usuarios.rows[0].total,
      estudiantes: estudiantes.rows[0].total,
      profesores: profesores.rows[0].total,
      administradores: administradores.rows[0].total,
      activos: activos.rows[0].total,
      inactivos: usuarios.rows[0].total - activos.rows[0].total,
      programas: programas.rows[0].total,
      materias: materias.rows[0].total,
      periodos: periodos.rows[0].total,
      ofertas: ofertas.rows[0].total,
      matriculas: matriculas.rows[0].total
    };
  }

  async getAdminRecentUsers(limit = 8) {
    const query = `
      SELECT u.id, u.nombre, u.apellido, u.email, u.activo, u.created_at, r.nombre AS rol
      FROM usuarios u
      JOIN roles r ON r.id = u.rol_id
      ORDER BY u.created_at DESC NULLS LAST, u.id DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  /**
   * Lista todas las ofertas con materia, profesor, horario y ocupación.
   * @returns {Promise<object[]>} Ofertas registradas.
   */
  async getAdminOfferings() {
    const query = `
      SELECT
        o.id, o.grupo, o.cupo, o.estado,
        m.id AS materia_id, m.codigo, m.nombre AS materia, m.creditos,
        pr.id AS periodo_id, pr.nombre AS periodo, pr.activo AS periodo_activo,
        pf.id AS profesor_id,
        CASE WHEN up.id IS NOT NULL THEN up.nombre || ' ' || up.apellido ELSE 'Sin asignar' END AS profesor,
        (
          SELECT COUNT(DISTINCT ma.estudiante_id)
          FROM matriculas ma
          WHERE ma.oferta_materia_id = o.id AND ma.estado = 'ACTIVA'
        ) AS estudiantes,
        (
          SELECT COUNT(c.id)
          FROM calificaciones c
          JOIN matriculas ma ON ma.id = c.matricula_id
          WHERE ma.oferta_materia_id = o.id
        ) AS calificados,
        (
          SELECT string_agg(DISTINCT
            h.dia_semana || ' ' || to_char(h.hora_inicio, 'HH24:MI') || '-' ||
            to_char(h.hora_fin, 'HH24:MI') || COALESCE(' · ' || h.aula, ''), ' / ')
          FROM horarios h
          WHERE h.oferta_materia_id = o.id
        ) AS horario
      FROM ofertas_materias o
      JOIN materias m ON m.id = o.materia_id
      JOIN periodos_academicos pr ON pr.id = o.periodo_id
      LEFT JOIN profesores pf ON pf.id = o.profesor_id
      LEFT JOIN usuarios up ON up.id = pf.usuario_id
      ORDER BY pr.activo DESC, m.nombre, o.grupo
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Lista estudiantes de una oferta sin validar propiedad docente.
   * @param {number|string} ofertaId Identificador de la oferta.
   * @returns {Promise<object[]>} Estudiantes matriculados con su última nota.
   */
  async getOfferingStudentsByOffering(ofertaId) {
    const query = `
      SELECT DISTINCT ON (e.id)
        ma.id AS matricula_id, ma.estado AS matricula_estado,
        e.id AS estudiante_id, e.documento,
        u.nombre, u.apellido, u.email,
        c.nota, c.observaciones, c.fecha_registro
      FROM matriculas ma
      JOIN estudiantes e ON e.id = ma.estudiante_id
      JOIN usuarios u ON u.id = e.usuario_id
      LEFT JOIN LATERAL (
        SELECT nota, observaciones, fecha_registro
        FROM calificaciones
        WHERE matricula_id = ma.id
        ORDER BY fecha_registro DESC, id DESC
        LIMIT 1
      ) c ON true
      WHERE ma.oferta_materia_id = $1 AND ma.estado = 'ACTIVA'
      ORDER BY e.id, ma.fecha_matricula DESC, ma.id DESC
    `;
    const result = await pool.query(query, [ofertaId]);
    return result.rows.sort((a, b) =>
      `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`)
    );
  }

  async getAdminProgramStats() {
    const query = `
      SELECT pa.id, pa.codigo, pa.nombre,
             COUNT(e.id)::int AS estudiantes
      FROM programas_academicos pa
      LEFT JOIN estudiantes e ON e.programa_id = pa.id
      GROUP BY pa.id, pa.codigo, pa.nombre
      ORDER BY estudiantes DESC, pa.nombre
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = new PortalRepository();
