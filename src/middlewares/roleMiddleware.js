const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // Verificamos que el usuario esté autenticado y que su rol esté permitido
    if (!req.user || !allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Acceso prohibido. No cuentas con los privilegios requeridos para esta acción.' 
      });
    }
    next();
  };
};

module.exports = requireRole;