/**
 * Error con estado HTTP para que los controladores devuelvan respuestas
 * coherentes sin exponer detalles internos.
 */
class HttpError extends Error {
  /**
   * @param {string} message Mensaje seguro para el cliente.
   * @param {number} status Código HTTP.
   */
  constructor(message, status = 400) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

module.exports = HttpError;
