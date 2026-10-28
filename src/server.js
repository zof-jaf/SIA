const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const academicRoutes = require('./routes/academicRoutes');
const matriculaRoutes = require('./routes/matriculaRoutes');
const calificacionRoutes = require('./routes/calificacionRoutes');
const portalRoutes = require('./routes/portalRoutes');

const app = express();

app.use(express.json());
app.use(cookieParser());

const docsPath = path.join(__dirname, '../docs');
app.use(express.static(docsPath));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/matriculas', matriculaRoutes);
app.use('/api/calificaciones', calificacionRoutes);
app.use('/api/portal', portalRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor activo' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(docsPath, 'index.html'));
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado correctamente en el puerto ${PORT}`);
});
