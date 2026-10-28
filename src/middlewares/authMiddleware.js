const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  let token = req.cookies ? req.cookies.token : null;

  const authHeader = req.headers['authorization'];
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
    const secretKey = process.env.JWT_SECRET || 'secreto_universidad_web2';
    const decoded = jwt.verify(token, secretKey);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Token inválido o expirado.'
    });
  }
};

module.exports = verifyToken;
