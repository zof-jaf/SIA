const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

router.post(
  '/programs',
  authMiddleware,
  requireRole(['ADMINISTRADOR']),
  (req, res) => academicController.createProgram(req, res)
);

router.get(
  '/programs',
  authMiddleware,
  (req, res) => academicController.listPrograms(req, res)
);

router.post(
  '/subjects',
  authMiddleware,
  requireRole(['ADMINISTRADOR']),
  (req, res) => academicController.createSubject(req, res)
);

router.get(
  '/subjects',
  authMiddleware,
  (req, res) => academicController.listSubjects(req, res)
);

router.post(
  '/curriculum',
  authMiddleware,
  requireRole(['ADMINISTRADOR']),
  (req, res) => academicController.linkSubject(req, res)
);

router.get(
  '/programs/:id/curriculum',
  authMiddleware,
  (req, res) => academicController.getCurriculum(req, res)
);

module.exports = router;
