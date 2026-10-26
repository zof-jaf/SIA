const express = require('express');
const app = express();


app.use(express.json()); // Vital para poder leer JSON en los req.body

// Importar rutas
const userRoutes = require('./routes/userRoutes');
const academicRoutes = require('./routes/academicRoutes');


// Usar rutas
app.use('/api/users', userRoutes);
app.use('/api/academic', academicRoutes);


// Ruta de salud que ya tenías
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor activo' });
});

module.exports = app;