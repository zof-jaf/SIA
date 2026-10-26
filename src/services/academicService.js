const academicRepository = require('../repositories/academicRepository');

class AcademicService {
  // Programas
  async createProgram(data) {
    return await academicRepository.createProgram(data);
  }

  async getPrograms() {
    return await academicRepository.getAllPrograms();
  }

  // Materias
  async createSubject(data) {
    return await academicRepository.createSubject(data);
  }

  async getSubjects() {
    return await academicRepository.getAllSubjects();
  }

  // Malla curricular
  async linkSubject(data) {
    return await academicRepository.linkSubjectToProgram(data);
  }

  async getProgramCurriculum(programa_id) {
    return await academicRepository.getCurriculumByProgram(programa_id);
  }
}

module.exports = new AcademicService();
