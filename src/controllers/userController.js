const userService = require('../services/userService');

class UserController {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await userService.authenticateUser(email, password);
      res.json(result);
    } catch (error) {
      res.status(401).json({ success: false, error: error.message });
    }
  }

  async registerStudent(req, res) {
    try {
      const result = await userService.registerStudent(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async registerProfessor(req, res) {
    try {
      const result = await userService.registerProfessor(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async registerAdmin(req, res) {
    try {
      const result = await userService.registerAdmin(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async listStudents(req, res) {
    try {
      const list = await userService.getStudents();
      res.json({ success: true, data: list });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async listProfessors(req, res) {
    try {
      const list = await userService.getProfessors();
      res.json({ success: true, data: list });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const { activo } = req.body;
      const result = await userService.setUserStatus(id, activo);
      res.json({ success: true, message: `Estado actualizado a ${activo}`, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

module.exports = new UserController();