const academicService = require('../services/academicService');

class AcademicController {
  // Programas
  async createProgram(req, res) {
    try {
      const result = await academicService.createProgram(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async listPrograms(req, res) {
    try {
      const result = await academicService.getPrograms();
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Materias
  async createSubject(req, res) {
    try {
      const result = await academicService.createSubject(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async listSubjects(req, res) {
    try {
      const result = await academicService.getSubjects();
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Asignar materia a programa
  async linkSubject(req, res) {
    try {
      const result = await academicService.linkSubject(req.body);
      res.status(201).json({ success: true, message: 'Materia vinculada al programa con éxito', data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getCurriculum(req, res) {
    try {
      const { id } = req.params;
      const result = await academicService.getProgramCurriculum(id);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new AcademicController();
