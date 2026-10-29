const tramiteService = require('../services/tramiteService');

/**
 * Controlador HTTP para la consulta y radicación de trámites.
 */
class TramiteController {
  /**
   * Lista los trámites visibles para el usuario autenticado.
   * @param {import('express').Request} req Petición con filtros opcionales.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async listTramites(req, res) {
    try {
      const data = await tramiteService.listTramites(req.user, req.query);
      res.json({ success: true, data });
    } catch (error) {
      res.status(error.status || 400).json({ success: false, error: error.message });
    }
  }

  /**
   * Consulta un trámite por identificador.
   * @param {import('express').Request} req Petición con el id del trámite.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async getTramite(req, res) {
    try {
      const data = await tramiteService.getTramite(req.user, req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      res.status(error.status || 400).json({ success: false, error: error.message });
    }
  }

  /**
   * Registra un trámite académico.
   * @param {import('express').Request} req Petición con los datos del trámite.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async createTramite(req, res) {
    try {
      const data = await tramiteService.createTramite(req.body, req.user);
      res.status(201).json({ success: true, message: 'Trámite radicado con éxito', data });
    } catch (error) {
      res.status(error.status || 400).json({ success: false, error: error.message });
    }
  }
}

module.exports = new TramiteController();
