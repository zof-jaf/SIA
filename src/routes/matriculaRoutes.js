const express = require('express');
const router = express.Router();
const matriculaController = require('../controllers/matriculaController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

// Periodos Académicos
router.post('/periodos', authMiddleware, requireRole(['ADMINISTRADOR']), (req, res) => matriculaController.createPeriod(req, res));
router.get('/periodos', authMiddleware, (req, res) => matriculaController.listPeriods(req, res));

// Matrículas
router.post('/', authMiddleware, requireRole(['ADMINISTRADOR', 'ESTUDIANTE']), (req, res) => matriculaController.createMatricula(req, res));
router.get('/estudiante/:estudiante_id', authMiddleware, (req, res) => matriculaController.getMatriculasByEstudiante(req, res));

module.exports = router;
