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
  let studentCredentials;
  let studentId;
  let offeringId;
  let periodId;
  let programId;
  let subjectId;
  let enrollmentId;
  let tramiteId;

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

    const studentEmail = `estudiante.test.${suffix}@universidad.edu.co`;
    const studentPassword = crypto.randomBytes(16).toString('hex');
    studentCredentials = { email: studentEmail, password: studentPassword };

    const studentUserRes = await pool.query(
      `INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id, activo)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id`,
      [
        'Estudiante',
        'Prueba',
        studentEmail,
        await bcrypt.hash(studentPassword, 10),
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

    periodId = periodRes.rows[0].id;

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

  test('10. POST /api/tramites - Radica un trámite como administrador', async () => {
    const res = await agent
      .post('/api/tramites')
      .send({
        estudiante_id: studentId,
        periodo_id: periodId,
        tipo_tramite: 'Certificado de calificaciones',
        detalles: 'Solicitud creada por la prueba E2E'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.estado).toBe('Pendiente');
    expect(res.body.data.tipoTramite).toBe('Certificado de calificaciones');
    expect(res.body.data.estudianteId).toBe(studentId);

    tramiteId = res.body.data.id;
  });

  test('11. GET /api/tramites/:id - Consulta el trámite radicado', async () => {
    const res = await agent.get(`/api/tramites/${tramiteId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe(tramiteId);
    expect(res.body.data.detalles).toContain('prueba E2E');
  });

  test('12. GET /api/tramites - El estudiante solo consulta sus trámites y no puede crear', async () => {
    const studentAgent = request.agent(app);
    const login = await studentAgent.post('/api/auth/login').send(studentCredentials);
    expect(login.statusCode).toBe(200);

    const list = await studentAgent.get('/api/tramites');
    expect(list.statusCode).toBe(200);
    expect(list.body.data.every((tramite) => tramite.estudianteId === studentId)).toBe(true);
    expect(list.body.data.some((tramite) => tramite.id === tramiteId)).toBe(true);

    const forbidden = await studentAgent
      .post('/api/tramites')
      .send({
        estudiante_id: studentId,
        tipo_tramite: 'Certificado de estudios'
      });
    expect(forbidden.statusCode).toBe(403);
  });

  test('13. GET /api/portal/student/dashboard - Separa periodo activo e historial completo', async () => {
    const offeringContext = await pool.query(
      'SELECT profesor_id FROM ofertas_materias WHERE id = $1',
      [offeringId]
    );
    const profesorId = offeringContext.rows[0].profesor_id;

    const historicalPeriod = await pool.query(
      `INSERT INTO periodos_academicos (nombre, fecha_inicio, fecha_fin, activo)
       VALUES ($1, CURRENT_DATE - INTERVAL '180 days', CURRENT_DATE - INTERVAL '60 days', false)
       RETURNING id`,
      [`Periodo histórico ${suffix}`]
    );

    const historicalOffering = await pool.query(
      `INSERT INTO ofertas_materias (materia_id, profesor_id, periodo_id, grupo, cupo, estado)
       VALUES ($1, $2, $3, $4, 30, 'CERRADA')
       RETURNING id`,
      [subjectId, profesorId, historicalPeriod.rows[0].id, `HIS-${suffix}`]
    );

    const historicalEnrollment = await pool.query(
      `INSERT INTO matriculas (estudiante_id, oferta_materia_id, fecha_matricula, estado)
       VALUES ($1, $2, CURRENT_TIMESTAMP, 'ACTIVA')
       RETURNING id`,
      [studentId, historicalOffering.rows[0].id]
    );

    await pool.query(
      `INSERT INTO calificaciones (matricula_id, nota, observaciones)
       VALUES ($1, 3.2, 'Observación histórica de prueba')`,
      [historicalEnrollment.rows[0].id]
    );

    const pendingOffering = await agent
      .post('/api/academic/offerings')
      .send({
        materia_id: subjectId,
        profesor_id: profesorId,
        periodo_id: periodId,
        grupo: `PEND-${suffix}`,
        cupo: 30,
        estado: 'ABIERTA'
      });
    expect(pendingOffering.statusCode).toBe(201);

    const studentAgent = request.agent(app);
    await studentAgent.post('/api/auth/login').send(studentCredentials);

    const pendingEnrollment = await studentAgent
      .post('/api/matriculas')
      .send({ oferta_materia_id: pendingOffering.body.data.id });
    expect(pendingEnrollment.statusCode).toBe(201);

    const dashboard = await studentAgent.get('/api/portal/student/dashboard');
    expect(dashboard.statusCode).toBe(200);

    const { grades, history, pendingCourses } = dashboard.body.data;
    expect(grades.every((grade) => grade.periodoActivo === true)).toBe(true);
    expect(grades.some((grade) => grade.observaciones === 'Evaluación integral E2E aprobada')).toBe(true);
    expect(history.length).toBeGreaterThan(grades.length);
    expect(history.some((grade) => grade.periodoActivo === false)).toBe(true);
    expect(
      pendingCourses.some((course) => course.ofertaId === pendingOffering.body.data.id)
    ).toBe(true);
    expect(pendingCourses.every((course) => course.nota === null)).toBe(true);
  });
});
