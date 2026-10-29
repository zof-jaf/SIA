const matriculaRepository = require('../repositories/matriculaRepository');
const userRepository = require('../repositories/userRepository');
const HttpError = require('../utils/httpError');

/**
 * Resuelve el perfil de autorización del usuario autenticado.
 * @param {number|string} userId Identificador del usuario.
 * @returns {Promise<object>} Perfil con rol e identificadores.
 */
const getRequesterProfile = async (userId) => {
  const profile = await userRepository.getProfileByUserId(userId);

  if (!profile) throw new HttpError('Usuario no encontrado.', 404);
  if (!profile.activo) throw new HttpError('El usuario se encuentra inactivo.', 403);

  return profile;
};

/**
 * Servicio de periodos y matrículas con validación de propiedad y cupo.
 */
class MatriculaService {
  /**
   * Crea un periodo académico.
   * @param {object} data Datos del periodo.
   * @returns {Promise<object>} Periodo creado.
   */
  async createPeriod(data) {
    return matriculaRepository.createPeriod(data);
  }

  /**
   * Lista periodos académicos.
   * @returns {Promise<object[]>} Periodos registrados.
   */
  async getPeriods() {
    return matriculaRepository.getPeriods();
  }

  /**
   * Lista la oferta disponible del periodo activo para el estudiante actual.
   * @param {object} requester Usuario autenticado.
   * @param {number|string|undefined} estudianteId Identificador opcional para administradores.
   * @returns {Promise<object[]>} Ofertas disponibles.
   */
  async getAvailableOfferings(requester, estudianteId) {
    const profile = await getRequesterProfile(requester.id);
    let targetStudentId = null;

    if (profile.rol === 'ESTUDIANTE') {
      targetStudentId = profile.estudiante_id;
    } else if (profile.rol !== 'ADMINISTRADOR') {
      throw new HttpError('No tienes permisos para consultar la oferta académica.', 403);
    } else if (estudianteId) {
      targetStudentId = Number(estudianteId);
    }

    const offerings = await matriculaRepository.getAvailableOfferings(targetStudentId);

    return offerings.map((row) => ({
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
      profesor: row.profesor,
      estudiantes: Number(row.estudiantes),
      matriculado: row.matriculado,
      horario: row.horario || null
    }));
  }

  /**
   * Matricula a un estudiante validando rol, oferta, cupo y duplicados.
   * Un estudiante solo puede matricularse a sí mismo; un administrador puede
   * matricular a cualquier estudiante.
   * @param {object} data Identificadores de estudiante y oferta.
   * @param {object} requester Usuario autenticado.
   * @returns {Promise<object>} Matrícula creada.
   */
  async createMatricula(data, requester) {
    const profile = await getRequesterProfile(requester.id);
    const ofertaId = Number(data.oferta_materia_id);
    let estudianteId = Number(data.estudiante_id);

    if (!Number.isInteger(ofertaId)) {
      throw new HttpError('La oferta académica es obligatoria.', 400);
    }

    if (profile.rol === 'ESTUDIANTE') {
      if (!profile.estudiante_id) {
        throw new HttpError('El usuario no cuenta con perfil de estudiante.', 403);
      }
      estudianteId = profile.estudiante_id;
    } else if (profile.rol !== 'ADMINISTRADOR') {
      throw new HttpError('No tienes permisos para registrar matrículas.', 403);
    }

    if (!Number.isInteger(estudianteId)) {
      throw new HttpError('El estudiante es obligatorio.', 400);
    }

    const oferta = await matriculaRepository.getOfferingContext(ofertaId);

    if (!oferta) throw new HttpError('La oferta académica no existe.', 404);
    if (!oferta.periodo_activo) throw new HttpError('El periodo de la oferta no está activo.', 409);
    if (!['ABIERTA', 'ACTIVA'].includes(oferta.estado)) {
      throw new HttpError('La oferta no está abierta para matrícula.', 409);
    }

    const existing = await matriculaRepository.findActiveEnrollment(estudianteId, ofertaId);
    if (existing) throw new HttpError('El estudiante ya tiene una matrícula activa en esta oferta.', 409);

    if (oferta.cupo > 0) {
      const enrolled = await matriculaRepository.countActiveEnrollments(ofertaId);
      if (enrolled >= oferta.cupo) {
        throw new HttpError('La oferta académica no tiene cupos disponibles.', 409);
      }
    }

    return matriculaRepository.createMatricula({
      estudiante_id: estudianteId,
      oferta_materia_id: ofertaId
    });
  }

  /**
   * Consulta matrículas de un estudiante validando que el solicitante sea el
   * propio estudiante o un administrador.
   * @param {number|string} estudianteId Identificador del estudiante solicitado.
   * @param {object} requester Usuario autenticado.
   * @returns {Promise<object[]>} Matrículas del estudiante.
   */
  async getMatriculasByEstudiante(estudianteId, requester) {
    const profile = await getRequesterProfile(requester.id);
    const requestedId = Number(estudianteId);

    if (profile.rol === 'ESTUDIANTE' && profile.estudiante_id !== requestedId) {
      throw new HttpError('Solo puedes consultar tus propias matrículas.', 403);
    }

    if (profile.rol !== 'ESTUDIANTE' && profile.rol !== 'ADMINISTRADOR') {
      throw new HttpError('No tienes permisos para consultar matrículas.', 403);
    }

    return matriculaRepository.getMatriculasByEstudiante(requestedId);
  }
}

module.exports = new MatriculaService();
