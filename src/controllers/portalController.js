const portalService = require('../services/portalService');

/**
 * Controlador HTTP de los paneles por rol.
 */
class PortalController {
  /**
   * Devuelve el perfil del usuario autenticado.
   * @param {import('express').Request} req Petición autenticada.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async getMe(req, res) {
    try {
      const data = await portalService.getMe(req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      res.status(error.status || 404).json({ success: false, error: error.message });
    }
  }

  /**
   * Devuelve el panel del estudiante.
   * @param {import('express').Request} req Petición autenticada.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async getStudentDashboard(req, res) {
    try {
      const data = await portalService.getStudentDashboard(req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      res.status(error.status || 400).json({ success: false, error: error.message });
    }
  }

  /**
   * Devuelve el panel del profesor.
   * @param {import('express').Request} req Petición autenticada.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async getProfessorDashboard(req, res) {
    try {
      const data = await portalService.getProfessorDashboard(req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      res.status(error.status || 400).json({ success: false, error: error.message });
    }
  }

  /**
   * Devuelve los estudiantes de una oferta del profesor.
   * @param {import('express').Request} req Petición autenticada.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async getOfferingStudents(req, res) {
    try {
      const data = await portalService.getOfferingStudents(req.user.id, req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      res.status(error.status || 400).json({ success: false, error: error.message });
    }
  }

  /**
   * Devuelve los estudiantes y notas de una oferta para administración.
   * @param {import('express').Request} req Petición con el id de la oferta.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async getAdminOfferingStudents(req, res) {
    try {
      const data = await portalService.getAdminOfferingStudents(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      res.status(error.status || 400).json({ success: false, error: error.message });
    }
  }

  /**
   * Devuelve el panel administrativo.
   * @param {import('express').Request} req Petición autenticada.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async getAdminDashboard(req, res) {
    try {
      const data = await portalService.getAdminDashboard();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new PortalController();
