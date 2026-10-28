const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const USER_QUERY = `
  SELECT u.id, u.nombre, u.apellido, u.email, u.password_hash, u.activo, r.nombre AS rol
  FROM usuarios u
  JOIN roles r ON r.id = u.rol_id
  WHERE u.email = $1
`;

const buildUser = (usuario) => ({
  id: usuario.id,
  nombre: usuario.nombre,
  apellido: usuario.apellido,
  name: usuario.nombre,
  email: usuario.email,
  rol: usuario.rol
});

const signToken = (usuario) =>
  jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      name: usuario.nombre,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol
    },
    process.env.JWT_SECRET || 'secreto_desarrollo',
    { expiresIn: '24h' }
  );

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Por favor ingresa correo y contraseña.' });
  }

  try {
    const result = await db.query(USER_QUERY, [email.trim()]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos.' });
    }

    const usuario = result.rows[0];

    if (!usuario.activo) {
      return res.status(403).json({ success: false, message: 'El usuario se encuentra inactivo.' });
    }

    const match = await bcrypt.compare(password, usuario.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos.' });
    }

    const token = signToken(usuario);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      token,
      user: buildUser(usuario)
    });

  } catch (error) {
    console.error('Error al consultar la base de datos:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

router.get('/me', async (req, res) => {
  let token = req.cookies ? req.cookies.token : null;
  const authHeader = req.headers['authorization'];

  if (!token && authHeader) {
    token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  }

  if (!token) return res.status(401).json({ success: false, message: 'No autenticado' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_desarrollo');

    const result = await db.query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.activo, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE u.id = $1`,
      [decoded.id]
    );

    if (result.rows.length === 0 || !result.rows[0].activo) {
      return res.status(401).json({ success: false, message: 'Sesión no válida' });
    }

    return res.json({ success: true, user: buildUser(result.rows[0]) });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ success: true, message: 'Sesión cerrada exitosamente' });
});

module.exports = router;
