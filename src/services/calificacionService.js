const calificacionRepository = require('../repositories/calificacionRepository');

class CalificacionService {
  async registerCalificacion(data) {
    if (data.nota < 0 || data.nota > 5) {
      throw new Error('La nota debe estar entre 0.0 y 5.0');
    }
    return await calificacionRepository.createOrUpdateCalificacion(data);
  }

  async getHistoricoEstudiante(estudiante_id) {
    const notas = await calificacionRepository.getCalificacionesByEstudiante(estudiante_id);
    
    // Calcular promedio ponderado o simple
    if (notas.length === 0) {
      return { notas: [], promedio: 0 };
    }

    const sumaNotas = notas.reduce((acc, curr) => acc + parseFloat(curr.nota), 0);
    const promedio = (sumaNotas / notas.length).toFixed(2);

    return {
      promedio: parseFloat(promedio),
      total_materias: notas.length,
      notas
    };
  }
}

module.exports = new CalificacionService();
