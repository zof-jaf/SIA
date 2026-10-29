const portalRepository = require('../repositories/portalRepository');
const { normalizeRole } = require('../utils/roles');

/**
 * Convierte un valor numérico opcional conservando `null` para datos ausentes.
 * @param {unknown} value Valor original.
 * @returns {number | null} Número válido o `null`.
 */
const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

/**
 * Normaliza el perfil devuelto por el portal para el frontend.
 * @param {object} profile Fila de perfil.
 * @returns {object} Perfil público.
 */
const shapeProfile = (profile) => ({
  id: profile.id,
  nombre: profile.nombre,
  apellido: profile.apellido,
  nombreCompleto: `${profile.nombre || ''} ${profile.apellido || ''}`.trim(),
  email: profile.email,
  rol: normalizeRole(profile.rol) || profile.rol,
  activo: profile.activo,
  documento: profile.documento || null,
  programa: profile.programa || null,
  programaCodigo: profile.programa_codigo || null,
  duracionSemestres: profile.duracion_semestres || null,
  especialidad: profile.especialidad || null,
  estudianteId: profile.estudiante_id || null,
  profesorId: profile.profesor_id || null
});

/**
 * Normaliza un estudiante matriculado para las vistas de notas.
 * @param {object} row Fila de la consulta.
 * @returns {object} Estudiante público.
 */
const shapeOfferingStudent = (row) => ({
  matriculaId: row.matricula_id,
  estudianteId: row.estudiante_id,
  documento: row.documento,
  nombre: row.nombre,
  apellido: row.apellido,
  nombreCompleto: `${row.nombre} ${row.apellido}`.trim(),
  email: row.email,
  nota: toNumber(row.nota),
  observaciones: row.observaciones || null,
  fechaRegistro: row.fecha_registro || null
});

const pickEnrollment = (current, incoming) => {
  if (!current) return incoming;
  const currentScore = current.nota === null ? -1 : Number(current.nota);
  const incomingScore = incoming.nota === null ? -1 : Number(incoming.nota);
  if (incomingScore > currentScore) return incoming;
  if (incomingScore === currentScore && incoming.fecha_matricula > current.fecha_matricula) return incoming;
  return current;
};

class PortalService {
  /**
   * Obtiene el perfil del usuario autenticado.
   * @param {number|string} userId Identificador del usuario.
   * @returns {Promise<object>} Perfil público.
   */
  async getMe(userId) {
    const profile = await portalRepository.getUserProfile(userId);
    if (!profile) throw new Error('Usuario no encontrado.');
    return shapeProfile(profile);
  }

  /**
   * Construye el panel del estudiante con matrículas, horario, notas y avance.
   * @param {number|string} userId Identificador del usuario.
   * @returns {Promise<object>} Datos consolidados del estudiante.
   */
  async getStudentDashboard(userId) {
    const profile = await portalRepository.getUserProfile(userId);

    if (!profile) throw new Error('Usuario no encontrado.');
    if (!profile.estudiante_id) throw new Error('El usuario no cuenta con perfil de estudiante.');

    const [enrollments, grades, curriculum, period] = await Promise.all([
      portalRepository.getStudentEnrollments(profile.estudiante_id),
      portalRepository.getStudentGrades(profile.estudiante_id),
      profile.programa_id
        ? portalRepository.getProgramCurriculum(profile.programa_id)
        : Promise.resolve([]),
      portalRepository.getActivePeriod()
    ]);

    const uniqueEnrollments = new Map();
    for (const enrollment of enrollments) {
      const key = enrollment.oferta_id;
      uniqueEnrollments.set(key, pickEnrollment(uniqueEnrollments.get(key), enrollment));
    }

    const courses = Array.from(uniqueEnrollments.values()).map((row) => {
      const horarios = row.horarios || [];
      return {
        matriculaId: row.matricula_id,
        ofertaId: row.oferta_id,
        materiaId: row.materia_id,
        codigo: row.codigo,
        materia: row.materia,
        creditos: row.creditos,
        grupo: row.grupo,
        cupo: row.cupo,
        periodo: row.periodo,
        periodoActivo: row.periodo_activo,
        profesor: row.profesor || 'Sin docente asignado',
        estado: row.matricula_estado,
        nota: toNumber(row.nota),
        observaciones: row.observaciones || null,
        horarios
      };
    });

    const schedule = courses.flatMap((course) =>
      course.horarios.map((h) => ({
        materia: course.materia,
        codigo: course.codigo,
        profesor: course.profesor,
        dia: h.dia,
        inicio: h.inicio,
        fin: h.fin,
        aula: h.aula || 'Sin aula'
      }))
    );

    const curriculumIds = new Set(curriculum.map((item) => item.materia_id));
    const history = grades.map((row) => ({
      materiaId: row.materia_id,
      codigo: row.codigo,
      materia: row.materia,
      creditos: row.creditos,
      periodoId: row.periodo_id,
      periodo: row.periodo,
      periodoActivo: row.periodo_activo,
      nota: toNumber(row.nota),
      evaluaciones: Number(row.evaluaciones),
      fechaRegistro: row.fecha_registro,
      observaciones: row.observaciones || null
    }));
    const normalizedGrades = history.filter((grade) => grade.periodoActivo);

    const progressGrades = Array.from(
      history
        .reduce((current, grade) => {
          const previous = current.get(grade.materiaId);
          const previousScore = previous && previous.nota !== null ? previous.nota : -1;
          const gradeScore = grade.nota !== null ? grade.nota : -1;

          if (!previous || gradeScore > previousScore) {
            current.set(grade.materiaId, grade);
          }

          return current;
        }, new Map())
        .values()
    );

    const approvedGrades = progressGrades.filter((grade) => grade.nota !== null && grade.nota >= 3);
    const approvedInProgram = profile.programa_id
      ? approvedGrades.filter((grade) => curriculumIds.has(grade.materiaId))
      : approvedGrades;

    const totalCredits = curriculum.reduce((sum, item) => sum + (item.creditos || 0), 0);
    const approvedCredits = approvedInProgram.reduce((sum, item) => sum + (item.creditos || 0), 0);
    const pendingCredits = totalCredits > 0 ? Math.max(totalCredits - approvedCredits, 0) : 0;

    const scoredGrades = progressGrades.filter((grade) => grade.nota !== null);
    const average = scoredGrades.length
      ? Number(
          (
            scoredGrades.reduce((sum, grade) => sum + grade.nota, 0) / scoredGrades.length
          ).toFixed(2)
        )
      : null;

    const approvedIds = new Set(approvedInProgram.map((grade) => grade.materiaId));
    const pendingCurriculum = curriculum
      .filter((item) => !approvedIds.has(item.materia_id))
      .map((item) => ({
        materiaId: item.materia_id,
        codigo: item.codigo,
        materia: item.materia,
        creditos: item.creditos,
        semestre: item.semestre
      }));

    const pendingCourses = courses.filter(
      (course) => course.periodoActivo && course.estado === 'ACTIVA' && course.nota === null
    );

    return {
      profile: shapeProfile(profile),
      period: period || null,
      courses,
      pendingCourses,
      schedule,
      grades: normalizedGrades,
      history,
      progress: {
        totalCredits,
        approvedCredits,
        pendingCredits,
        percentage: totalCredits > 0 ? Math.round((approvedCredits / totalCredits) * 100) : 0,
        average,
        approvedCourses: approvedInProgram.map((grade) => ({
          materiaId: grade.materiaId,
          codigo: grade.codigo,
          materia: grade.materia,
          creditos: grade.creditos,
          nota: grade.nota
        })),
        pendingCourses: pendingCurriculum,
        hasCurriculum: curriculum.length > 0
      }
    };
  }

  /**
   * Construye el panel del profesor con sus ofertas y estadísticas.
   * @param {number|string} userId Identificador del usuario.
   * @returns {Promise<object>} Datos consolidados del profesor.
   */
  async getProfessorDashboard(userId) {
    const profile = await portalRepository.getUserProfile(userId);

    if (!profile) throw new Error('Usuario no encontrado.');
    if (!profile.profesor_id) throw new Error('El usuario no cuenta con perfil de profesor.');

    const [offerings, period] = await Promise.all([
      portalRepository.getProfessorOfferings(profile.profesor_id),
      portalRepository.getActivePeriod()
    ]);

    const shapedOfferings = offerings.map((row) => ({
      id: row.id,
      materiaId: row.materia_id,
      codigo: row.codigo,
      materia: row.materia,
      creditos: row.creditos,
      grupo: row.grupo,
      cupo: row.cupo,
      estado: row.estado,
      periodo: row.periodo,
      periodoActivo: row.periodo_activo,
      estudiantes: Number(row.estudiantes),
      calificados: Number(row.calificados),
      promedio: toNumber(row.promedio),
      horario: row.horario || null,
      horarios: Array.isArray(row.horarios) ? row.horarios : []
    }));

    const students = shapedOfferings.reduce((sum, item) => sum + item.estudiantes, 0);
    const graded = shapedOfferings.reduce((sum, item) => sum + item.calificados, 0);
    const averages = shapedOfferings.map((item) => item.promedio).filter((value) => value !== null);
    const average = averages.length
      ? Number((averages.reduce((sum, value) => sum + value, 0) / averages.length).toFixed(2))
      : null;

    return {
      profile: shapeProfile(profile),
      period: period || null,
      stats: {
        courses: shapedOfferings.length,
        students,
        graded,
        average
      },
      offerings: shapedOfferings
    };
  }

  /**
   * Lista estudiantes de una oferta validando que pertenezca al profesor.
   * @param {number|string} userId Identificador del usuario.
   * @param {number|string} offeringId Identificador de la oferta.
   * @returns {Promise<object[]>} Estudiantes matriculados.
   */
  async getOfferingStudents(userId, offeringId) {
    const profile = await portalRepository.getUserProfile(userId);
    if (!profile || !profile.profesor_id) {
      throw new Error('El usuario no cuenta con perfil de profesor.');
    }

    const students = await portalRepository.getOfferingStudents(profile.profesor_id, offeringId);
    if (students === null) throw new Error('La oferta académica no existe o no está asignada a este profesor.');

    return students.map(shapeOfferingStudent);
  }

  /**
   * Lista estudiantes de una oferta para el panel administrativo.
   * @param {number|string} offeringId Identificador de la oferta.
   * @returns {Promise<object[]>} Estudiantes matriculados.
   */
  async getAdminOfferingStudents(offeringId) {
    const students = await portalRepository.getOfferingStudentsByOffering(offeringId);
    return students.map(shapeOfferingStudent);
  }

  /**
   * Construye el panel administrativo con estadísticas y catálogo.
   * @returns {Promise<object>} Datos consolidados del sistema.
   */
  async getAdminDashboard() {
    const [stats, recentUsers, offerings, programStats, period] = await Promise.all([
      portalRepository.getAdminStats(),
      portalRepository.getAdminRecentUsers(),
      portalRepository.getAdminOfferings(),
      portalRepository.getAdminProgramStats(),
      portalRepository.getActivePeriod()
    ]);

    return {
      period: period || null,
      stats,
      recentUsers: recentUsers.map((user) => ({
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        nombreCompleto: `${user.nombre} ${user.apellido}`.trim(),
        email: user.email,
        rol: user.rol,
        activo: user.activo,
        createdAt: user.created_at
      })),
      offerings: offerings.map((row) => ({
        id: row.id,
        materiaId: row.materia_id,
        codigo: row.codigo,
        materia: row.materia,
        creditos: row.creditos,
        grupo: row.grupo,
        cupo: row.cupo,
        estado: row.estado,
        periodoId: row.periodo_id,
        periodo: row.periodo,
        periodoActivo: row.periodo_activo,
        profesorId: row.profesor_id,
        profesor: row.profesor,
        estudiantes: Number(row.estudiantes),
        calificados: Number(row.calificados),
        horario: row.horario || null
      })),
      programs: programStats.map((row) => ({
        id: row.id,
        codigo: row.codigo,
        nombre: row.nombre,
        estudiantes: Number(row.estudiantes)
      }))
    };
  }
}

module.exports = new PortalService();
