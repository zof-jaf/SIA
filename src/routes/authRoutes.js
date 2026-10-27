const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username && password) {
    res.cookie('token', 'jwt_de_prueba', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 
    });

    return res.json({ success: true, message: "Autenticación exitosa" });
  }

  return res.status(401).json({ success: false, message: "Usuario o contraseña incorrectos" });
});

router.get('/me', (req, res) => {
  const token = req.cookies ? req.cookies.token : null;
  
  if (!token) {
    return res.status(401).json({ success: false, message: "No autorizado" });
  }

  return res.json({ success: true, user: { userCode: "Estudiante" } });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ success: true, message: "Sesión cerrada correctamente" });
});

module.exports = router;