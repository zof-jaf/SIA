const academicService = require('../services/academicService');

/**
 * Controlador HTTP para programas, materias y mallas curriculares.
 */
class AcademicController {
  /**
   * Crea un programa académico.
   * @param {import('express').Request} req Petición con los datos del programa.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async createProgram(req, res) {
    try {
      const result = await academicService.createProgram(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(error.status || 400).json({ success: false, error: error.message });
    }
  }

  /**
   * Lista programas académicos.
   * @param {import('express').Request} req Petición autenticada.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async listPrograms(req, res) {
    try {
      const result = await academicService.getPrograms();
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Crea una materia.
   * @param {import('express').Request} req Petición con los datos de la materia.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async createSubject(req, res) {
    try {
      const result = await academicService.createSubject(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(error.status || 400).json({ success: false, error: error.message });
    }
  }

  /**
   * Lista materias.
   * @param {import('express').Request} req Petición autenticada.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async listSubjects(req, res) {
    try {
      const result = await academicService.getSubjects();
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Vincula una materia a un programa.
   * @param {import('express').Request} req Petición con programa, materia y semestre.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async linkSubject(req, res) {
    try {
      const result = await academicService.linkSubject(req.body);
      res.status(201).json({ success: true, message: 'Materia vinculada al programa con éxito', data: result });
    } catch (error) {
      res.status(error.status || 400).json({ success: false, error: error.message });
    }
  }

  /**
   * Consulta la malla curricular de un programa.
   * @param {import('express').Request} req Petición con el id del programa.
   * @param {import('express').Response} res Respuesta HTTP.
   */
  async getCurriculum(req, res) {
    try {
      const result = await academicService.getProgramCurriculum(req.params.id);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new AcademicController();
