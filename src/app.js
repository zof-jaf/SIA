const fs = require('fs');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
require('./config/env');

const corsMiddleware = require('./middlewares/corsMiddleware');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const academicRoutes = require('./routes/academicRoutes');
const matriculaRoutes = require('./routes/matriculaRoutes');
const calificacionRoutes = require('./routes/calificacionRoutes');
const portalRoutes = require('./routes/portalRoutes');

const app = express();

app.disable('x-powered-by');
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/matriculas', matriculaRoutes);
app.use('/api/calificaciones', calificacionRoutes);
app.use('/api/portal', portalRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor activo' });
});

const frontendDist = path.join(__dirname, '../frontend/dist');
const legacyDocs = path.join(__dirname, '../docs');

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

app.use(express.static(legacyDocs));

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

app.use((req, res, next) => {
  if (req.method !== 'GET') return next();

  const spaEntry = path.join(frontendDist, 'index.html');
  const legacyEntry = path.join(legacyDocs, 'index.html');

  if (fs.existsSync(spaEntry)) return res.sendFile(spaEntry);
  if (fs.existsSync(legacyEntry)) return res.sendFile(legacyEntry);

  return next();
});

app.use(errorHandler);

module.exports = app;
