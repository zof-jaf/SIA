const { normalizeRole } = require('../utils/roles');

/**
 * Crea un middleware que exige uno de los roles indicados.
 * @param {string[]} allowedRoles Roles autorizados.
 * @returns {import('express').RequestHandler} Middleware de autorización.
 */
const requireRole = (allowedRoles) => {
  const normalizedAllowed = allowedRoles.map((role) => normalizeRole(role)).filter(Boolean);

  return (req, res, next) => {
    if (!req.user || !normalizedAllowed.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso prohibido. No cuentas con los privilegios requeridos para esta acción.'
      });
    }

    return next();
  };
};

module.exports = requireRole;
