const calificacionService = require('../services/calificacionService');

/**
 * Controlador HTTP para calificaciones.
 */
class CalificacionController {
  /**
   * Registra una calificación.
   * @param {import('express').Request} req Petición con matrícula y nota.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async registerCalificacion(req, res) {
    try {
      const result = await calificacionService.registerCalificacion(req.body, req.user);
      res.status(201).json({ success: true, message: 'Calificación registrada con éxito', data: result });
    } catch (error) {
      res.status(error.status || 400).json({ success: false, error: error.message });
    }
  }

  /**
   * Consulta el histórico de calificaciones de un estudiante.
   * @param {import('express').Request} req Petición con el id del estudiante.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async getHistoricoEstudiante(req, res) {
    try {
      const result = await calificacionService.getHistoricoEstudiante(
        req.params.estudiante_id,
        req.user
      );
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new CalificacionController();
