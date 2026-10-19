const express = require('express');
const path = require('path');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, '../docs')));

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Servidor funcionando correctamente'
    });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/index.html'));
});

if (errorHandler) {
  app.use(errorHandler);
}

module.exports = app;
