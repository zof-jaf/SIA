const userService = require('../services/userService');
const pool = require('../config/db');

class UserController {
  // Endpoint de prueba rápido para verificar la conexión y ver los roles existentes
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
}

module.exports = new UserController();