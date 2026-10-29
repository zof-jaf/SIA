const express = require('express');
const router = express.Router();
const calificacionController = require('../controllers/calificacionController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

router.post(
  '/',
  authMiddleware,
  requireRole(['ADMINISTRADOR', 'PROFESOR']),
  (req, res) => calificacionController.registerCalificacion(req, res)
);

router.get(
  '/estudiante/:estudiante_id',
  authMiddleware,
  requireRole(['ADMINISTRADOR', 'ESTUDIANTE']),
  (req, res) => calificacionController.getHistoricoEstudiante(req, res)
);

module.exports = router;
