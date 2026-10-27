const matriculaRepository = require('../repositories/matriculaRepository');

class MatriculaService {
  async createPeriod(data) {
    return await matriculaRepository.createPeriod(data);
  }

  async getPeriods() {
    return await matriculaRepository.getPeriods();
  }

  async createMatricula(data) {
    return await matriculaRepository.createMatricula(data);
  }

  async getMatriculasByEstudiante(estudiante_id) {
    return await matriculaRepository.getMatriculasByEstudiante(estudiante_id);
  }
}

module.exports = new MatriculaService();