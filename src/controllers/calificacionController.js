const calificacionService = require('../services/calificacionService');

class CalificacionController {
  async registerCalificacion(req, res) {
    try {
      const result = await calificacionService.registerCalificacion(req.body);
      res.status(201).json({ success: true, message: 'Calificación registrada con éxito', data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getHistoricoEstudiante(req, res) {
    try {
      const { estudiante_id } = req.params;
      const result = await calificacionService.getHistoricoEstudiante(estudiante_id);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new CalificacionController();
