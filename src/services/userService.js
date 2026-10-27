const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class UserService {
  
  async authenticateUser(email, password) {
    const cleanEmail = email ? email.trim() : '';
    const cleanPassword = password ? password.trim() : '';

    const user = await userRepository.findByEmail(cleanEmail);

    if (!user) throw new Error('Credenciales inválidas.');
    if (!user.activo) throw new Error('El usuario se encuentra inactivo.');

    const isPasswordValid = await bcrypt.compare(cleanPassword, user.password_hash);
    if (!isPasswordValid) throw new Error('Credenciales inválidas.');

    const payload = { id: user.id, email: user.email, rol: user.rol };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secreto_por_defecto',
      { expiresIn: '8h' }
    );

    return {
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol
      }
    };
  }

  // Registrar Estudiante
  async registerStudent(data) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new Error('El correo ya está registrado.');

    const password_hash = await bcrypt.hash(data.password, 10);
    return await userRepository.createStudent({
      ...data,
      password_hash,
      activo: data.activo !== undefined ? data.activo : true
    });
  }

  // Registrar Profesor
  async registerProfessor(data) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new Error('El correo ya está registrado.');

    const password_hash = await bcrypt.hash(data.password, 10);
    return await userRepository.createProfessor({
      ...data,
      password_hash,
      activo: data.activo !== undefined ? data.activo : true
    });
  }

  // Registrar Administrador
  async registerAdmin(data) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new Error('El correo ya está registrado.');

    const password_hash = await bcrypt.hash(data.password, 10);
    return await userRepository.createAdmin({
      ...data,
      password_hash,
      activo: data.activo !== undefined ? data.activo : true
    });
  }

  // Listar
  async getStudents() { return await userRepository.getAllStudents(); }
  async getProfessors() { return await userRepository.getAllProfessors(); }

  // Activar / Desactivar
  async setUserStatus(userId, status) {
    return await userRepository.toggleUserActive(userId, status);
  }
}

module.exports = new UserService();