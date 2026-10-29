const calificacionRepository = require('../repositories/calificacionRepository');
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
 * Servicio de calificaciones con control de propiedad de la oferta.
 */
class CalificacionService {
  /**
   * Registra una evaluación validando rango de nota y que el profesor sea
   * dueño de la oferta asociada a la matrícula.
   * @param {object} data Matrícula, nota y observaciones.
   * @param {object} requester Usuario autenticado.
   * @returns {Promise<object>} Calificación creada.
   */
  async registerCalificacion(data, requester) {
    const profile = await getRequesterProfile(requester.id);

    if (!['PROFESOR', 'ADMINISTRADOR'].includes(profile.rol)) {
      throw new HttpError('No tienes permisos para registrar calificaciones.', 403);
    }

    const matriculaId = Number(data.matricula_id);
    const nota = Number(data.nota);

    if (!Number.isInteger(matriculaId)) {
      throw new HttpError('La matrícula es obligatoria.', 400);
    }

    if (!Number.isFinite(nota) || nota < 0 || nota > 5) {
      throw new HttpError('La nota debe estar entre 0.0 y 5.0.', 400);
    }

    const context = await matriculaRepository.getMatriculaContext(matriculaId);
    if (!context) throw new HttpError('La matrícula no existe.', 404);
    if (context.estado !== 'ACTIVA') {
      throw new HttpError('No se pueden calificar matrículas inactivas.', 409);
    }

    if (profile.rol === 'PROFESOR' && context.profesor_id !== profile.profesor_id) {
      throw new HttpError('Solo puedes calificar estudiantes de tus propios cursos.', 403);
    }

    return calificacionRepository.createOrUpdateCalificacion({
      matricula_id: matriculaId,
      nota,
      observaciones: typeof data.observaciones === 'string' ? data.observaciones.trim() : null
    });
  }

  /**
   * Consulta el histórico de un estudiante validando que sea el propio
   * estudiante o un administrador.
   * @param {number|string} estudianteId Identificador del estudiante.
   * @param {object} requester Usuario autenticado.
   * @returns {Promise<object>} Histórico y promedio.
   */
  async getHistoricoEstudiante(estudianteId, requester) {
    const profile = await getRequesterProfile(requester.id);
    const requestedId = Number(estudianteId);

    if (profile.rol === 'ESTUDIANTE' && profile.estudiante_id !== requestedId) {
      throw new HttpError('Solo puedes consultar tus propias calificaciones.', 403);
    }

    if (profile.rol !== 'ESTUDIANTE' && profile.rol !== 'ADMINISTRADOR') {
      throw new HttpError('No tienes permisos para consultar este historial.', 403);
    }

    const notas = await calificacionRepository.getCalificacionesByEstudiante(requestedId);

    if (notas.length === 0) {
      return { notas: [], promedio: 0 };
    }

    const sumaNotas = notas.reduce((acc, curr) => acc + parseFloat(curr.nota), 0);
    const promedio = (sumaNotas / notas.length).toFixed(2);

    return {
      promedio: parseFloat(promedio),
      total_materias: notas.length,
      notas
    };
  }
}

module.exports = new CalificacionService();
