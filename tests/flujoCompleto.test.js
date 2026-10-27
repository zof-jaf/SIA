const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const bcrypt = require('bcrypt');

describe('Pruebas Automáticas - Sistema Académico', () => {
  let adminToken;
  let programaId;
  let materiaId;
  let matriculaId;

  const adminCredentials = {
    email: 'julian.admin@universidad.edu.co',
    password: 'admin'
  };

  beforeAll(async () => {
    // 1. Obtener o crear ID del rol ADMINISTRADOR
    let roleRes = await pool.query("SELECT id FROM roles WHERE nombre = 'ADMINISTRADOR'");
    let adminRoleId = roleRes.rows[0]?.id;

    if (!adminRoleId) {
      const newRole = await pool.query("INSERT INTO roles (nombre) VALUES ('ADMINISTRADOR') RETURNING id");
      adminRoleId = newRole.rows[0].id;
    }

    // 2. Verificar o crear el usuario Admin de prueba con la columna password_hash
    const userRes = await pool.query("SELECT id FROM usuarios WHERE email = $1", [adminCredentials.email]);
    if (userRes.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(adminCredentials.password, 10);
      await pool.query(
        "INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id, activo) VALUES ($1, $2, $3, $4, $5, true)",
        ['Admin', 'Test', adminCredentials.email, hashedPassword, adminRoleId]
      );
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  test('1. POST /api/users/login - Debe autenticar al Administrador y retornar un token JWT', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send(adminCredentials);

    expect(res.statusCode).toBe(200);
    
    adminToken = res.body.token || res.body.data?.token;
    expect(adminToken).toBeDefined();
  });

  test('2. POST /api/academic/programs - Debe registrar un nuevo programa académico', async () => {
    const res = await request(app)
      .post('/api/academic/programs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Ingeniería de Software Automatizada',
        codigo: 'ING-AUTO-01'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('id');

    programaId = res.body.data.id;
  });

  test('3. POST /api/academic/subjects - Debe registrar una nueva materia', async () => {
    const res = await request(app)
      .post('/api/academic/subjects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Pruebas Continuas y CI/CD',
        codigo: 'TST-101',
        creditos: 3
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('id');

    materiaId = res.body.data.id;
  });

  test('4. POST /api/matriculas - Debe registrar una nueva matrícula', async () => {
    const res = await request(app)
      .post('/api/matriculas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        estudiante_id: 1,
        oferta_materia_id: 1
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('id');

    matriculaId = res.body.data.id;
  });

  test('5. POST /api/calificaciones - Debe registrar una calificación válida', async () => {
    const res = await request(app)
      .post('/api/calificaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        matricula_id: matriculaId,
        nota: 4.80,
        observaciones: 'Evaluación integral E2E aprobada'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.nota).toBe('4.80');
  });

  test('6. GET /api/calificaciones/estudiante/1 - Debe consultar el histórico y promedio del estudiante', async () => {
    const res = await request(app)
      .get('/api/calificaciones/estudiante/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('promedio');
    expect(Array.isArray(res.body.data.notas)).toBe(true);
  });
});
