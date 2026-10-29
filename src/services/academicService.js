const academicRepository = require('../repositories/academicRepository');
const HttpError = require('../utils/httpError');

const VALID_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const VALID_STATES = ['ABIERTA', 'ACTIVA', 'CERRADA'];
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Valida y normaliza un horario enviado por el administrador.
 * @param {object} horario Día, hora inicial, hora final y aula.
 * @returns {object} Horario listo para persistir.
 */
const normalizeSchedule = (horario) => {
  const dia = String(horario.dia_semana || '').trim();
  const inicio = String(horario.hora_inicio || '').trim();
  const fin = String(horario.hora_fin || '').trim();

  if (!VALID_DAYS.includes(dia)) {
    throw new HttpError('El día del horario no es válido.', 400);
  }

  if (!TIME_PATTERN.test(inicio) || !TIME_PATTERN.test(fin) || inicio >= fin) {
    throw new HttpError('El horario debe tener una hora inicial y final válidas.', 400);
  }

  return {
    dia_semana: dia,
    hora_inicio: inicio,
    hora_fin: fin,
    aula: horario.aula ? String(horario.aula).trim() : null
  };
};

/**
 * Servicio del catálogo académico.
 */
class AcademicService {
  /**
   * Crea un programa académico.
   * @param {object} data Datos del programa.
   * @returns {Promise<object>} Programa creado.
   */
  async createProgram(data) {
    if (!data.nombre || !data.codigo) {
      throw new HttpError('El nombre y el código del programa son obligatorios.', 400);
    }

    return academicRepository.createProgram(data);
  }

  /**
   * Lista programas académicos.
   * @returns {Promise<object[]>} Programas registrados.
   */
  async getPrograms() {
    return academicRepository.getAllPrograms();
  }

  /**
   * Crea una materia.
   * @param {object} data Datos de la materia.
   * @returns {Promise<object>} Materia creada.
   */
  async createSubject(data) {
    const creditos = Number(data.creditos);

    if (!data.nombre || !data.codigo) {
      throw new HttpError('El nombre y el código de la materia son obligatorios.', 400);
    }

    if (!Number.isInteger(creditos) || creditos <= 0) {
      throw new HttpError('Los créditos deben ser un entero mayor que cero.', 400);
    }

    return academicRepository.createSubject({ ...data, creditos });
  }

  /**
   * Lista materias.
   * @returns {Promise<object[]>} Materias registradas.
   */
  async getSubjects() {
    return academicRepository.getAllSubjects();
  }

  /**
   * Crea una oferta académica que asocia materia, profesor, periodo y horario.
   * @param {object} data Datos de la oferta.
   * @returns {Promise<object>} Oferta creada.
   */
  async createOffering(data) {
    const materiaId = Number(data.materia_id);
    const profesorId = Number(data.profesor_id);
    const periodoId = Number(data.periodo_id);
    const cupo = data.cupo === undefined || data.cupo === '' ? 30 : Number(data.cupo);
    const grupo = String(data.grupo || 'A').trim().toUpperCase();
    const estado = String(data.estado || 'ABIERTA').trim().toUpperCase();
    const horarios = Array.isArray(data.horarios) ? data.horarios.map(normalizeSchedule) : [];

    if (!Number.isInteger(materiaId) || !Number.isInteger(profesorId) || !Number.isInteger(periodoId)) {
      throw new HttpError('Materia, profesor y periodo son obligatorios.', 400);
    }

    if (!Number.isInteger(cupo) || cupo < 0) {
      throw new HttpError('El cupo debe ser un entero mayor o igual a cero.', 400);
    }

    if (!grupo) {
      throw new HttpError('El grupo de la oferta es obligatorio.', 400);
    }

    if (!VALID_STATES.includes(estado)) {
      throw new HttpError('El estado de la oferta no es válido.', 400);
    }

    const context = await academicRepository.getOfferingCreationContext({
      materia_id: materiaId,
      profesor_id: profesorId,
      periodo_id: periodoId
    });

    if (!context) {
      throw new HttpError('El periodo seleccionado no existe.', 404);
    }

    if (!context.materia) {
      throw new HttpError('La materia seleccionada no existe.', 404);
    }

    if (!context.profesor_id) {
      throw new HttpError('El profesor seleccionado no existe.', 404);
    }

    return academicRepository.createOfferingWithSchedules({
      materia_id: materiaId,
      profesor_id: profesorId,
      periodo_id: periodoId,
      grupo,
      cupo,
      estado,
      horarios
    });
  }

  /**
   * Vincula una materia a un programa.
   * @param {object} data Identificadores y semestre.
   * @returns {Promise<object>} Vínculo creado.
   */
  async linkSubject(data) {
    if (!data.programa_id || !data.materia_id) {
      throw new HttpError('El programa y la materia son obligatorios.', 400);
    }

    return academicRepository.linkSubjectToProgram(data);
  }

  /**
   * Obtiene la malla curricular de un programa.
   * @param {number|string} programaId Identificador del programa.
   * @returns {Promise<object[]>} Materias de la malla.
   */
  async getProgramCurriculum(programaId) {
    return academicRepository.getCurriculumByProgram(programaId);
  }
}

module.exports = new AcademicService();
