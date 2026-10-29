const crypto = require('crypto');
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const pool = require('../src/config/db');

/**
 * Crea un administrador único para la ejecución de pruebas y devuelve sus
 * credenciales, evitando credenciales fijas en el código.
 * @returns {Promise<{ email: string, password: string }>} Credenciales de prueba.
 */
const createTestAdmin = async () => {
  const suffix = `${Date.now()}${crypto.randomBytes(3).toString('hex')}`;
  const email = `admin.test.${suffix}@universidad.edu.co`;
  const password = crypto.randomBytes(16).toString('hex');

  let roleRes = await pool.query("SELECT id FROM roles WHERE nombre = 'ADMINISTRADOR'");
  let adminRoleId = roleRes.rows[0]?.id;

  if (!adminRoleId) {
    const newRole = await pool.query("INSERT INTO roles (nombre) VALUES ('ADMINISTRADOR') RETURNING id");
    adminRoleId = newRole.rows[0].id;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await pool.query(
    'INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id, activo) VALUES ($1, $2, $3, $4, $5, true)',
    ['Admin', 'Test', email, hashedPassword, adminRoleId]
  );

  return { email, password };
};

describe('Pruebas Automáticas - Sistema Académico', () => {
  const agent = request.agent(app);
  const suffix = String(Date.now()).slice(-6);
  let adminCredentials;
  let studentId;
  let offeringId;
  let programId;
  let subjectId;
  let enrollmentId;

  beforeAll(async () => {
    adminCredentials = await createTestAdmin();
  });

  afterAll(async () => {
    await pool.end();
  });

  test('1. POST /api/auth/login - Autentica al administrador y crea la sesión', async () => {
    const res = await agent
      .post('/api/auth/login')
      .send(adminCredentials);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.rol).toBe('ADMINISTRADOR');
    expect(res.body.token).toBeUndefined();
  });

  test('2. GET /api/portal/admin/dashboard - Rechaza la petición sin sesión', async () => {
    const res = await request(app).get('/api/portal/admin/dashboard');
    expect(res.statusCode).toBe(401);
  });

  test('3. GET /api/portal/student/dashboard - Impide que un administrador use el panel de estudiante', async () => {
    const res = await agent.get('/api/portal/student/dashboard');
    expect(res.statusCode).toBe(403);
  });

  test('4. POST /api/academic/programs - Registra un programa académico', async () => {
    const res = await agent
      .post('/api/academic/programs')
      .send({
        nombre: `Ingeniería de Software Automatizada ${suffix}`,
        codigo: `ING-AUTO-${suffix}`
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('id');

    programId = res.body.data.id;
    expect(programId).toBeDefined();
  });

  test('5. POST /api/academic/subjects - Registra una materia', async () => {
    const res = await agent
      .post('/api/academic/subjects')
      .send({
        nombre: `Pruebas Continuas y CI/CD ${suffix}`,
        codigo: `TST-${suffix}`,
        creditos: 3
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('id');

    subjectId = res.body.data.id;
    expect(subjectId).toBeDefined();
  });

  test('6. POST /api/academic/offerings y /api/matriculas - Asigna materia y matricula', async () => {
    const studentRoleRes = await pool.query("SELECT id FROM roles WHERE nombre = 'ESTUDIANTE'");
    const studentRoleId = studentRoleRes.rows[0]?.id;
    expect(studentRoleId).toBeDefined();

    const studentUserRes = await pool.query(
      `INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id, activo)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id`,
      [
        'Estudiante',
        'Prueba',
        `estudiante.test.${suffix}@universidad.edu.co`,
        await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10),
        studentRoleId
      ]
    );

    const studentRes = await pool.query(
      'INSERT INTO estudiantes (usuario_id, documento, programa_id) VALUES ($1, $2, $3) RETURNING id',
      [studentUserRes.rows[0].id, `TST-${suffix}`, programId]
    );
    studentId = studentRes.rows[0]?.id;
    expect(studentId).toBeDefined();

    const professorRes = await pool.query('SELECT id FROM profesores ORDER BY id ASC LIMIT 1');
    expect(professorRes.rows[0]?.id).toBeDefined();

    let periodRes = await pool.query(
      'SELECT id FROM periodos_academicos WHERE activo = true ORDER BY id ASC LIMIT 1'
    );

    if (!periodRes.rows[0]?.id) {
      periodRes = await pool.query(
        `INSERT INTO periodos_academicos (nombre, fecha_inicio, fecha_fin, activo)
         VALUES ($1, CURRENT_DATE, CURRENT_DATE + INTERVAL '120 days', true)
         RETURNING id`,
        [`Periodo ${suffix}`]
      );
    }

    const offeringRes = await agent
      .post('/api/academic/offerings')
      .send({
        materia_id: subjectId,
        profesor_id: professorRes.rows[0].id,
        periodo_id: periodRes.rows[0].id,
        grupo: `TST-${suffix}`,
        cupo: 30,
        estado: 'ABIERTA',
        horarios: [
          {
            dia_semana: 'Lunes',
            hora_inicio: '08:00',
            hora_fin: '10:00',
            aula: 'B-101'
          }
        ]
      });

    expect(offeringRes.statusCode).toBe(201);
    offeringId = offeringRes.body.data.id;
    expect(offeringId).toBeDefined();
    expect(offeringRes.body.data.horarios).toHaveLength(1);

    const offers = await agent.get(`/api/matriculas/ofertas?estudiante_id=${studentId}`);
    expect(offers.statusCode).toBe(200);
    expect(offers.body.data.some((offering) => offering.id === offeringId)).toBe(true);

    const res = await agent
      .post('/api/matriculas')
      .send({
        estudiante_id: studentId,
        oferta_materia_id: offeringId
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('id');

    enrollmentId = res.body.data.id;
  });

  test('7. GET /api/portal/admin/offerings/:id/students - Lista estudiantes y notas desde administración', async () => {
    const res = await agent.get(`/api/portal/admin/offerings/${offeringId}/students`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.some((student) => student.estudianteId === studentId)).toBe(true);
  });

  test('8. POST /api/calificaciones - Registra una calificación válida', async () => {
    const res = await agent
      .post('/api/calificaciones')
      .send({
        matricula_id: enrollmentId,
        nota: 4.8,
        observaciones: 'Evaluación integral E2E aprobada'
      });

    expect(res.statusCode).toBe(201);
    expect(Number(res.body.data.nota)).toBe(4.8);
  });

  test('9. GET /api/calificaciones/estudiante/:id - Consulta histórico y promedio', async () => {
    const res = await agent.get(`/api/calificaciones/estudiante/${studentId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('promedio');
    expect(Array.isArray(res.body.data.notas)).toBe(true);
  });
});
