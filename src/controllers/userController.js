const userService = require('../services/userService');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

class UserController {
  // Endpoint de prueba rápido para verificar la conexión y ver los roles
  async testConnection(req, res) {
    try {
      const result = await pool.query('SELECT * FROM roles');
      res.json({
        success: true,
        message: '¡Conexión y consulta a la base de datos exitosa!',
        roles: result.rows
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Controlador para registrar un usuario
  async register(req, res) {
    try {
      const { nombre, apellido, email, password, rolId } = req.body;
      const newUser = await userService.registerUser(nombre, apellido, email, password, rolId);
      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: newUser
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Validar credenciales usando el servicio
      const user = await userService.authenticateUser(email, password);

      // Generar un Token JWT válido por 8 horas (asegúrate de tener JWT_SECRET en tu .env o usa un texto por defecto temporal)
      const secretKey = process.env.JWT_SECRET || 'secreto_universidad_web2';
      const token = jwt.sign(
        { id: user.id, email: user.email, rol: user.rol },
        secretKey,
        { expiresIn: '8h' }
      );

      // Responder con el token y los datos del usuario (sin contraseña)
      res.json({
        success: true,
        message: 'Login exitoso',
        token,
        data: user
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new UserController();