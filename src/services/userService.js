const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class UserService {
  
  async authenticateUser(email, password) {
    // 1. Limpieza de espacios accidentales
    const cleanEmail = email ? email.trim() : '';
    const cleanPassword = password ? password.trim() : '';

    const user = await userRepository.findByEmail(cleanEmail);

    if (!user) {
      throw new Error('Credenciales inválidas.');
    }

    if (!user.activo) {
      throw new Error('El usuario se encuentra inactivo.');
    }

    // 2. Comparación explícita con bcrypt
    const isPasswordValid = await bcrypt.compare(cleanPassword, user.password_hash);
    
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas.');
    }

    // 3. Generación de Token JWT
    const payload = {
      id: user.id,
      email: user.email,
      rol: user.rol
    };

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

  async register(userData) {
    const { nombre, apellido, email, password, rol_id, activo } = userData;

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('El correo electrónico ya se encuentra registrado.');
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const newUser = await userRepository.create({
      nombre,
      apellido,
      email,
      password_hash,
      rol_id,
      activo: activo !== undefined ? activo : true
    });

    return newUser;
  }
}

module.exports = new UserService();