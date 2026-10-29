const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

router.post(
  '/students',
  authMiddleware,
  requireRole(['ADMINISTRADOR']),
  (req, res) => userController.registerStudent(req, res)
);

router.post(
  '/professors',
  authMiddleware,
  requireRole(['ADMINISTRADOR']),
  (req, res) => userController.registerProfessor(req, res)
);

router.post(
  '/admins',
  authMiddleware,
  requireRole(['ADMINISTRADOR']),
  (req, res) => userController.registerAdmin(req, res)
);

router.patch(
  '/:id/status',
  authMiddleware,
  requireRole(['ADMINISTRADOR']),
  (req, res) => userController.toggleStatus(req, res)
);

router.get(
  '/students',
  authMiddleware,
  requireRole(['ADMINISTRADOR']),
  (req, res) => userController.listStudents(req, res)
);

router.get(
  '/professors',
  authMiddleware,
  requireRole(['ADMINISTRADOR']),
  (req, res) => userController.listProfessors(req, res)
);

module.exports = router;
