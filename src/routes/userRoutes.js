const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

// Ruta pública para el Login
router.post('/login', userController.login);
router.post('/register', authMiddleware, requireRole(['Administrador']), userController.register);
module.exports = router;