const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Por favor ingresa correo y contraseña.' });
  }

  try {
    const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos.' });
    }

    const usuario = result.rows[0];

    const match = await bcrypt.compare(password, usuario.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos.' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, name: usuario.nombre },
      process.env.JWT_SECRET || 'secreto_desarrollo',
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      user: {
        email: usuario.email,
        name: usuario.nombre || 'Estudiante'
      }
    });

  } catch (error) {
    console.error('Error al consultar la base de datos:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

router.get('/me', (req, res) => {
  const token = req.cookies ? req.cookies.token : null;
  if (!token) return res.status(401).json({ success: false, message: 'No autenticado' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_desarrollo');
    return res.json({ success: true, user: decoded });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ success: true, message: 'Sesión cerrada exitosamente' });
});

module.exports = router;