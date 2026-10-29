const matriculaService = require('../services/matriculaService');

/**
 * Controlador HTTP para periodos académicos y matrículas.
 */
class MatriculaController {
  /**
   * Crea un periodo académico.
   * @param {import('express').Request} req Petición con los datos del periodo.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async createPeriod(req, res) {
    try {
      const result = await matriculaService.createPeriod(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(error.status || 400).json({ success: false, error: error.message });
    }
  }

  /**
   * Lista periodos académicos.
   * @param {import('express').Request} req Petición autenticada.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async listPeriods(req, res) {
    try {
      const result = await matriculaService.getPeriods();
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Lista la oferta disponible del periodo activo.
   * @param {import('express').Request} req Petición autenticada.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async listAvailableOfferings(req, res) {
    try {
      const result = await matriculaService.getAvailableOfferings(req.user, req.query.estudiante_id);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, error: error.message });
    }
  }

  /**
   * Registra una matrícula.
   * @param {import('express').Request} req Petición con estudiante y oferta.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async createMatricula(req, res) {
    try {
      const result = await matriculaService.createMatricula(req.body, req.user);
      res.status(201).json({ success: true, message: 'Estudiante matriculado con éxito', data: result });
    } catch (error) {
      res.status(error.status || 400).json({ success: false, error: error.message });
    }
  }

  /**
   * Consulta las matrículas de un estudiante.
   * @param {import('express').Request} req Petición con el id del estudiante.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async getMatriculasByEstudiante(req, res) {
    try {
      const result = await matriculaService.getMatriculasByEstudiante(req.params.estudiante_id, req.user);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new MatriculaController();
