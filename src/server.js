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
  const indexPath = path.join(__dirname, '../docs/index.html');
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error("Error buscando index.html en:", indexPath);
      console.error("Detalle del error:", err);
      res.status(404).send(`Error al cargar la página. El servidor buscó en: ${indexPath}. Revisa los nombres de las carpetas.`);
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});