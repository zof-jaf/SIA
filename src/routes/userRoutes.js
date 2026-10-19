const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Ruta de prueba para consultar los roles en la BD
router.get('/test-db', userController.testConnection);

// Ruta para registrar usuarios
router.post('/register', userController.register);

module.exports = router;