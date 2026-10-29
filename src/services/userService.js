const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');
const HttpError = require('../utils/httpError');

const SALT_ROUNDS = 10;

/**
 * Valida los campos mínimos para crear un usuario.
 * @param {object} data Datos recibidos.
 */
const validateUserPayload = (data) => {
  if (!data.nombre || !data.apellido || !data.email || !data.password) {
    throw new HttpError('Nombre, apellido, correo y contraseña son obligatorios.', 400);
  }

  if (String(data.password).length < 8) {
    throw new HttpError('La contraseña debe tener al menos 8 caracteres.', 400);
  }

  if (!String(data.email).includes('@')) {
    throw new HttpError('El correo no tiene un formato válido.', 400);
  }
};

/**
 * Servicio de usuarios: registro y activación/desactivación.
 */
class UserService {
  /**
   * Registra un estudiante y su perfil académico.
   * @param {object} data Datos del estudiante.
   * @returns {Promise<object>} Registro creado.
   */
  async registerStudent(data) {
    validateUserPayload(data);
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new HttpError('El correo ya está registrado.', 409);

    const password_hash = await bcrypt.hash(data.password, SALT_ROUNDS);
    return userRepository.createStudent({
      ...data,
      password_hash,
      activo: data.activo !== undefined ? data.activo : true
    });
  }

  /**
   * Registra un profesor y su perfil docente.
   * @param {object} data Datos del profesor.
   * @returns {Promise<object>} Registro creado.
   */
  async registerProfessor(data) {
    validateUserPayload(data);
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new HttpError('El correo ya está registrado.', 409);

    const password_hash = await bcrypt.hash(data.password, SALT_ROUNDS);
    return userRepository.createProfessor({
      ...data,
      password_hash,
      activo: data.activo !== undefined ? data.activo : true
    });
  }

  /**
   * Registra un administrador.
   * @param {object} data Datos del administrador.
   * @returns {Promise<object>} Registro creado.
   */
  async registerAdmin(data) {
    validateUserPayload(data);
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new HttpError('El correo ya está registrado.', 409);

    const password_hash = await bcrypt.hash(data.password, SALT_ROUNDS);
    return userRepository.createAdmin({
      ...data,
      password_hash,
      activo: data.activo !== undefined ? data.activo : true
    });
  }

  /**
   * Lista estudiantes con su información académica.
   * @returns {Promise<object[]>} Estudiantes registrados.
   */
  async getStudents() {
    return userRepository.getAllStudents();
  }

  /**
   * Lista profesores con su información docente.
   * @returns {Promise<object[]>} Profesores registrados.
   */
  async getProfessors() {
    return userRepository.getAllProfessors();
  }

  /**
   * Activa o desactiva lógicamente un usuario.
   * @param {number|string} userId Identificador del usuario.
   * @param {boolean} status Nuevo estado.
   * @returns {Promise<object>} Usuario actualizado.
   */
  async setUserStatus(userId, status) {
    return userRepository.toggleUserActive(userId, status);
  }
}

module.exports = new UserService();
