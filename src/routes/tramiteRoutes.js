const express = require('express');
const router = express.Router();
const tramiteController = require('../controllers/tramiteController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

router.get(
  '/',
  authMiddleware,
  requireRole(['ADMINISTRADOR', 'ESTUDIANTE']),
  (req, res) => tramiteController.listTramites(req, res)
);

router.post(
  '/',
  authMiddleware,
  requireRole(['ADMINISTRADOR']),
  (req, res) => tramiteController.createTramite(req, res)
);

router.get(
  '/:id',
  authMiddleware,
  requireRole(['ADMINISTRADOR', 'ESTUDIANTE']),
  (req, res) => tramiteController.getTramite(req, res)
);

module.exports = router;
