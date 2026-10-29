const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { getJwtSecret, isProduction } = require('../config/env');
const { normalizeRole } = require('../utils/roles');

const router = express.Router();

const USER_QUERY = `
  SELECT u.id, u.nombre, u.apellido, u.email, u.password_hash, u.activo, r.nombre AS rol
  FROM usuarios u
  JOIN roles r ON r.id = u.rol_id
  WHERE u.email = $1
`;

/**
 * Construye el objeto de usuario expuesto por la API, con el rol normalizado.
 * @param {object} usuario Fila de la base de datos.
 * @returns {object | null} Usuario público o `null` si el rol no es válido.
 */
const buildUser = (usuario) => {
  const rol = normalizeRole(usuario.rol);

  if (!rol) return null;

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    name: usuario.nombre,
    email: usuario.email,
    rol
  };
};

/**
 * Firma el token de sesión con el rol canónico del usuario.
 * @param {object} usuario Usuario autenticado.
 * @param {string} rol Rol normalizado.
 * @returns {string} Token JWT.
 */
const signToken = (usuario, rol) =>
  jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      name: usuario.nombre,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol
    },
    getJwtSecret(),
    { expiresIn: '24h' }
  );

/**
 * Opciones de la cookie httpOnly que mantiene la sesión.
 * @returns {object} Opciones compatibles con Express.
 */
const cookieOptions = () => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: 'lax',
  path: '/',
  maxAge: 24 * 60 * 60 * 1000
});

/**
 * Autentica un usuario y crea la cookie de sesión. El token no se devuelve
 * en el cuerpo para reducir su exposición ante XSS.
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Por favor ingresa correo y contraseña.' });
  }

  try {
    const result = await db.query(USER_QUERY, [String(email).trim()]);

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

    const user = buildUser(usuario);
    if (!user) {
      return res.status(403).json({ success: false, message: 'El rol del usuario no está habilitado.' });
    }

    const token = signToken(usuario, user.rol);
    res.cookie('token', token, cookieOptions());

    return res.json({ success: true, user });
  } catch (error) {
    console.error('Error al autenticar usuario:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

/**
 * Devuelve el usuario de la sesión actual validando el token y su estado activo.
 */
router.get('/me', async (req, res) => {
  let token = req.cookies ? req.cookies.token : null;
  const authHeader = req.headers.authorization;

  if (!token && authHeader) {
    token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  }

  if (!token) return res.status(401).json({ success: false, message: 'No autenticado' });

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    const result = await db.query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.activo, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE u.id = $1`,
      [decoded.id]
    );

    const usuario = result.rows[0];

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ success: false, message: 'Sesión no válida' });
    }

    const user = buildUser(usuario);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Rol de usuario no habilitado' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
});

/**
 * Elimina la cookie de sesión.
 */
router.post('/logout', (req, res) => {
  const options = cookieOptions();
  delete options.maxAge;
  res.clearCookie('token', options);
  return res.json({ success: true, message: 'Sesión cerrada exitosamente' });
});

module.exports = router;
