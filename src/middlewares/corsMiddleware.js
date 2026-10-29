/**
 * Lista explícita de orígenes permitidos para llamadas directas al backend.
 * En desarrollo se usa el proxy de Vite; en producción se recomienda servir
 * frontend y backend bajo el mismo dominio o configurar `CORS_ORIGINS`.
 * @returns {string[]} Orígenes configurados.
 */
const getAllowedOrigins = () =>
  (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

/**
 * Middleware CORS con allowlist y soporte de cookies de sesión.
 * @param {import('express').Request} req Petición entrante.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 */
const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();
  const originAllowed = Boolean(origin) && (allowedOrigins.includes('*') || allowedOrigins.includes(origin));

  if (originAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '600');
  }

  if (req.method === 'OPTIONS') {
    return originAllowed ? res.sendStatus(204) : res.sendStatus(403);
  }

  return next();
};

module.exports = corsMiddleware;
