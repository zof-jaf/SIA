const userService = require('../services/userService');

/**
 * Controlador HTTP para la gestión de usuarios.
 */
class UserController {
  /**
   * Registra un estudiante.
   * @param {import('express').Request} req Petición con los datos del estudiante.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async registerStudent(req, res) {
    try {
      const result = await userService.registerStudent(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(error.status || 400).json({ success: false, error: error.message });
    }
  }

  /**
   * Registra un profesor.
   * @param {import('express').Request} req Petición con los datos del profesor.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async registerProfessor(req, res) {
    try {
      const result = await userService.registerProfessor(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(error.status || 400).json({ success: false, error: error.message });
    }
  }

  /**
   * Registra un administrador.
   * @param {import('express').Request} req Petición con los datos del administrador.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async registerAdmin(req, res) {
    try {
      const result = await userService.registerAdmin(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(error.status || 400).json({ success: false, error: error.message });
    }
  }

  /**
   * Lista estudiantes.
   * @param {import('express').Request} req Petición autenticada.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async listStudents(req, res) {
    try {
      const list = await userService.getStudents();
      res.json({ success: true, data: list });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Lista profesores.
   * @param {import('express').Request} req Petición autenticada.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async listProfessors(req, res) {
    try {
      const list = await userService.getProfessors();
      res.json({ success: true, data: list });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Activa o desactiva un usuario.
   * @param {import('express').Request} req Petición con el id y el nuevo estado.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const { activo } = req.body;

      if (typeof activo !== 'boolean') {
        return res.status(400).json({ success: false, error: 'El campo activo debe ser booleano.' });
      }

      const result = await userService.setUserStatus(id, activo);
      res.json({ success: true, message: `Estado actualizado a ${activo}`, data: result });
    } catch (error) {
      res.status(error.status || 400).json({ success: false, error: error.message });
    }
  }
}

module.exports = new UserController();
