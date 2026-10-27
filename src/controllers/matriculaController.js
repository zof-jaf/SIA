const matriculaService = require('../services/matriculaService');

class MatriculaController {
  async createPeriod(req, res) {
    try {
      const result = await matriculaService.createPeriod(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async listPeriods(req, res) {
    try {
      const result = await matriculaService.getPeriods();
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createMatricula(req, res) {
    try {
      const result = await matriculaService.createMatricula(req.body);
      res.status(201).json({ success: true, message: 'Estudiante matriculado con éxito', data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getMatriculasByEstudiante(req, res) {
    try {
      const { estudiante_id } = req.params;
      const result = await matriculaService.getMatriculasByEstudiante(estudiante_id);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new MatriculaController();
