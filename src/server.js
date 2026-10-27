const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(express.json());
app.use(cookieParser());

const docsPath = path.join(__dirname, '../docs');
app.use(express.static(docsPath));

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send("¡El servidor Express está respondiendo correctamente!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});