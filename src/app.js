const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(express.json());
app.use(cookieParser());

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const academicRoutes = require('./routes/academicRoutes');
const matriculaRoutes = require('./routes/matriculaRoutes');
const calificacionRoutes = require('./routes/calificacionRoutes');
const portalRoutes = require('./routes/portalRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/matriculas', matriculaRoutes);
app.use('/api/calificaciones', calificacionRoutes);
app.use('/api/portal', portalRoutes);

app.use(express.static(path.join(__dirname, '../docs')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor activo' });
});

app.use(errorHandler);

module.exports = app;
