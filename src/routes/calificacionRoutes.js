const express = require('express');
const router = express.Router();
const calificacionController = require('../controllers/calificacionController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

// Registrar o editar nota (Profesores y Administradores)
router.post('/', authMiddleware, requireRole(['ADMINISTRADOR', 'PROFESOR']), (req, res) => calificacionController.registerCalificacion(req, res));

// Consultar histórico de notas de un estudiante
router.get('/estudiante/:estudiante_id', authMiddleware, (req, res) => calificacionController.getHistoricoEstudiante(req, res));

module.exports = router;
