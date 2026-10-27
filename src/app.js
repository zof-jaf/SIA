const express = require('express');
const app = express();


app.use(express.json()); // Vital para poder leer JSON en los req.body

// Importar rutas
const userRoutes = require('./routes/userRoutes');
const academicRoutes = require('./routes/academicRoutes');
const matriculaRoutes = require('./routes/matriculaRoutes');
const calificacionRoutes = require('./routes/calificacionRoutes');


app.use('/api/users', userRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/matriculas', matriculaRoutes);
app.use('/api/calificaciones', calificacionRoutes);



app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor activo' });
});

module.exports = app;