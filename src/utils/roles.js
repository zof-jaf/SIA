const ROLES = Object.freeze({
  ESTUDIANTE: 'ESTUDIANTE',
  PROFESOR: 'PROFESOR',
  ADMINISTRADOR: 'ADMINISTRADOR'
});

const ROLE_ALIASES = Object.freeze({
  ESTUDIANTE: ROLES.ESTUDIANTE,
  ALUMNO: ROLES.ESTUDIANTE,
  STUDENT: ROLES.ESTUDIANTE,
  PROFESOR: ROLES.PROFESOR,
  PROFESSOR: ROLES.PROFESOR,
  DOCENTE: ROLES.PROFESOR,
  TEACHER: ROLES.PROFESOR,
  ADMINISTRADOR: ROLES.ADMINISTRADOR,
  ADMINISTRATOR: ROLES.ADMINISTRADOR,
  ADMIN: ROLES.ADMINISTRADOR
});

/**
 * Normaliza el nombre de un rol proveniente de la base de datos o de un token.
 * @param {unknown} value Valor original.
 * @returns {string | null} Rol canónico o `null` cuando no es reconocido.
 */
const normalizeRole = (value) => {
  if (typeof value !== 'string') return null;
  return ROLE_ALIASES[value.trim().toUpperCase()] || null;
};

module.exports = {
  ROLES,
  normalizeRole
};
