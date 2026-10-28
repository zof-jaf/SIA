const portalService = require('../services/portalService');

class PortalController {
  async getMe(req, res) {
    try {
      const data = await portalService.getMe(req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  async getStudentDashboard(req, res) {
    try {
      const data = await portalService.getStudentDashboard(req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getProfessorDashboard(req, res) {
    try {
      const data = await portalService.getProfessorDashboard(req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getOfferingStudents(req, res) {
    try {
      const data = await portalService.getOfferingStudents(req.user.id, req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

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
