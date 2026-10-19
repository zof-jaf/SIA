const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');

class UserService {
  // Lógica para registrar un usuario nuevo con contraseña encriptada
  async registerUser(nombre, apellido, email, password, rolId) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('El correo electrónico ya está registrado.');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await userRepository.createUser(nombre, apellido, email, passwordHash, rolId);
    return newUser;
  }

  // Lógica para validar el login de un usuario
  async authenticateUser(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Credenciales inválidas.');
    }

    if (!user.activo) {
      throw new Error('El usuario se encuentra inactivo.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas.');
    }

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

module.exports = new UserService();