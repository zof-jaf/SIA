const express = require('express');
const app = express();

app.use(express.json()); // Vital para poder leer JSON en los req.body

// Importar rutas
const userRoutes = require('./routes/userRoutes');

app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor activo' });
});

module.exports = app;