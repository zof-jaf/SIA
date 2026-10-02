const express = require('express');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Servidor funcionando correctamente'
    });
});

app.use(errorHandler);

module.exports = app;