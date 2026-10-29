/**
 * Middleware central de errores. Devuelve un mensaje seguro al cliente.
 * @param {Error & { status?: number }} err Error capturado.
 * @param {import('express').Request} req Petición entrante.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} _next Siguiente middleware.
 */
function errorHandler(err, req, res, _next) {
  console.error(err);

  const status = err.status || 500;
  const message = status >= 500 ? 'Error interno del servidor' : err.message;

  res.status(status).json({
    status: 'error',
    message: message || 'Error interno del servidor'
  });
}

module.exports = errorHandler;
