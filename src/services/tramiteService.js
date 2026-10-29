const tramiteRepository = require('../repositories/tramiteRepository');
const userRepository = require('../repositories/userRepository');
const HttpError = require('../utils/httpError');

const ESTADOS_PERMITIDOS = ['Pendiente', 'En proceso', 'Aprobado', 'Rechazado', 'Cancelado'];
const ESTADO_INICIAL = 'Pendiente';

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
 * Normaliza el estado recibido a uno de los valores permitidos.
 * @param {unknown} value Estado solicitado.
 * @returns {string | null} Estado canónico o `null` cuando no es válido.
 */
const normalizeEstado = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return ESTADOS_PERMITIDOS.find((estado) => estado.toLowerCase() === normalized) || null;
};

/**
 * Convierte una fila de trámite al formato usado por el frontend.
 * @param {object} row Fila con relaciones de estudiante y periodo.
 * @returns {object} Trámite público.
 */
const shapeTramite = (row) => ({
  id: row.id,
  estudianteId: row.estudiante_id,
  documento: row.documento,
  estudiante: `${row.nombre || ''} ${row.apellido || ''}`.trim(),
  email: row.email,
  periodoId: row.periodo_id,
  periodo: row.periodo || null,
  tipoTramite: row.tipo_tramite,
  estado: row.estado || ESTADO_INICIAL,
  fechaSolicitud: row.fecha_solicitud,
  fechaResolucion: row.fecha_resolucion,
  detalles: row.detalles || null
});

/**
 * Servicio de trámites con control de propiedad por rol.
 */
class TramiteService {
  /**
   * Lista trámites: un estudiante solo ve los propios y un administrador ve todos.
   * @param {object} requester Usuario autenticado.
   * @param {object} filters Filtros opcionales de estado, tipo y estudiante.
   * @returns {Promise<object[]>} Trámites visibles para el usuario.
   */
  async listTramites(requester, filters = {}) {
    const profile = await getRequesterProfile(requester.id);
    const query = {};

    if (profile.rol === 'ESTUDIANTE') {
      if (!profile.estudiante_id) {
        throw new HttpError('El usuario no cuenta con perfil de estudiante.', 403);
      }
      query.estudianteId = profile.estudiante_id;
    } else if (profile.rol === 'ADMINISTRADOR') {
      if (filters.estudiante_id) {
        const estudianteId = Number(filters.estudiante_id);
        if (!Number.isInteger(estudianteId)) {
          throw new HttpError('El estudiante indicado no es válido.', 400);
        }
        query.estudianteId = estudianteId;
      }
    } else {
      throw new HttpError('No tienes permisos para consultar trámites.', 403);
    }

    if (filters.estado) {
      const estado = normalizeEstado(filters.estado);
      if (!estado) throw new HttpError('El estado indicado no es válido.', 400);
      query.estado = estado;
    }

    if (filters.tipo_tramite) {
      query.tipoTramite = String(filters.tipo_tramite).trim().slice(0, 60);
    }

    const tramites = await tramiteRepository.findAll(query);
    return tramites.map(shapeTramite);
  }

  /**
   * Consulta un trámite validando que el estudiante sea el propietario.
   * @param {object} requester Usuario autenticado.
   * @param {number|string} id Identificador del trámite.
   * @returns {Promise<object>} Trámite consultado.
   */
  async getTramite(requester, id) {
    const profile = await getRequesterProfile(requester.id);
    const tramiteId = Number(id);

    if (!Number.isInteger(tramiteId)) {
      throw new HttpError('El identificador del trámite no es válido.', 400);
    }

    const tramite = await tramiteRepository.findById(tramiteId);
    if (!tramite) throw new HttpError('El trámite no existe.', 404);

    if (profile.rol === 'ESTUDIANTE' && tramite.estudiante_id !== profile.estudiante_id) {
      throw new HttpError('Solo puedes consultar tus propios trámites.', 403);
    }

    if (profile.rol !== 'ESTUDIANTE' && profile.rol !== 'ADMINISTRADOR') {
      throw new HttpError('No tienes permisos para consultar trámites.', 403);
    }

    return shapeTramite(tramite);
  }

  /**
   * Registra un trámite. La creación está reservada a administradores.
   * @param {object} data Datos del trámite.
   * @param {object} requester Usuario autenticado.
   * @returns {Promise<object>} Trámite creado.
   */
  async createTramite(data, requester) {
    const profile = await getRequesterProfile(requester.id);

    if (profile.rol !== 'ADMINISTRADOR') {
      throw new HttpError('Solo un administrador puede radicar trámites.', 403);
    }

    const estudianteId = Number(data.estudiante_id);
    if (!Number.isInteger(estudianteId)) {
      throw new HttpError('El estudiante es obligatorio.', 400);
    }

    const tipoTramite = String(data.tipo_tramite || '').trim();
    if (!tipoTramite) throw new HttpError('El tipo de trámite es obligatorio.', 400);
    if (tipoTramite.length > 60) {
      throw new HttpError('El tipo de trámite no puede superar 60 caracteres.', 400);
    }

    const estado = normalizeEstado(data.estado || ESTADO_INICIAL);
    if (!estado) {
      throw new HttpError(
        `El estado debe ser uno de: ${ESTADOS_PERMITIDOS.join(', ')}.`,
        400
      );
    }

    let periodoId = null;
    if (data.periodo_id !== undefined && data.periodo_id !== null && data.periodo_id !== '') {
      periodoId = Number(data.periodo_id);
      if (!Number.isInteger(periodoId)) {
        throw new HttpError('El periodo académico no es válido.', 400);
      }
    }

    if (!(await tramiteRepository.studentExists(estudianteId))) {
      throw new HttpError('El estudiante no existe.', 404);
    }

    if (periodoId && !(await tramiteRepository.periodExists(periodoId))) {
      throw new HttpError('El periodo académico no existe.', 404);
    }

    const detalles = data.detalles ? String(data.detalles).trim() : null;
    const tramite = await tramiteRepository.create({
      estudiante_id: estudianteId,
      periodo_id: periodoId,
      tipo_tramite: tipoTramite,
      estado,
      detalles
    });

    return shapeTramite(tramite);
  }
}

module.exports = new TramiteService();
