require('dotenv').config({ quiet: true });

/**
 * Obtiene el secreto usado para firmar y verificar tokens JWT.
 * La aplicación falla de forma explícita si la variable no está configurada,
 * evitando secretos por defecto escritos en el código.
 * @returns {string} Secreto JWT configurado en el entorno.
 */
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET no está configurado. Define la variable en el archivo .env.');
  }

  return secret;
};

/**
 * Indica si la cookie de sesión debe viajar solo por HTTPS.
 * @returns {boolean} `true` en producción.
 */
const isProduction = () => process.env.NODE_ENV === 'production';

module.exports = {
  getJwtSecret,
  isProduction
};
