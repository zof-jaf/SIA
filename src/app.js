const express = require('express');
const path = require('path');
const errorHandler = require('./middlewares/errorHandler');

const app = express();


app.use(express.json()); 

const userRoutes = require('./routes/userRoutes');
const academicRoutes = require('./routes/academicRoutes');
const matriculaRoutes = require('./routes/matriculaRoutes');
const calificacionRoutes = require('./routes/calificacionRoutes');


app.use('/api/users', userRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/matriculas', matriculaRoutes);
app.use('/api/calificaciones', calificacionRoutes);



app.use(express.static(path.join(__dirname, '../docs')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor activo' });
});

module.exports = app;
