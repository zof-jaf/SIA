const express = require('express');
const router = express.Router();
const portalController = require('../controllers/portalController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

router.get('/me', authMiddleware, (req, res) => portalController.getMe(req, res));

router.get(
  '/student/dashboard',
  authMiddleware,
  requireRole(['ESTUDIANTE']),
  (req, res) => portalController.getStudentDashboard(req, res)
);

router.get(
  '/professor/dashboard',
  authMiddleware,
  requireRole(['PROFESOR']),
  (req, res) => portalController.getProfessorDashboard(req, res)
);

router.get(
  '/professor/offerings/:id/students',
  authMiddleware,
  requireRole(['PROFESOR']),
  (req, res) => portalController.getOfferingStudents(req, res)
);

router.get(
  '/admin/dashboard',
  authMiddleware,
  requireRole(['ADMINISTRADOR']),
  (req, res) => portalController.getAdminDashboard(req, res)
);

module.exports = router;
