const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/env');
const { normalizeRole } = require('../utils/roles');

/**
 * Verifica el token JWT desde la cookie httpOnly o el encabezado Authorization
 * y adjunta el usuario autenticado a la petición.
 * @param {import('express').Request} req Petición entrante.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 */
const verifyToken = (req, res, next) => {
  let token = req.cookies ? req.cookies.token : null;

  const authHeader = req.headers.authorization;
  if (!token && authHeader) {
    token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No se encontró un token de autenticación.'
    });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const rol = normalizeRole(decoded.rol);

    if (!rol) {
      return res.status(403).json({
        success: false,
        error: 'El rol asociado a la sesión no es válido.'
      });
    }

    req.user = { ...decoded, rol };
    return next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Token inválido o expirado.'
    });
  }
};

module.exports = verifyToken;
