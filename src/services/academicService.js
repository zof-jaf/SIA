const academicRepository = require('../repositories/academicRepository');
const HttpError = require('../utils/httpError');

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
