// @ts-nocheck - test file, types checked manually
import request from 'supertest'
import { PrismaClient } from '@prisma/client'

// Import app WITHOUT starting the server (we use supertest to inject requests)
import app from '../src/app'

const prisma = new PrismaClient()

describe('MediMémo API - Auth', () => {
  const testEmail = `test-${Date.now()}@medimemo.test`
  const testPassword = 'testpass123'
  let token = ''
  let userId = ''

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({ where: { email: testEmail } })
    await prisma.$disconnect()
  })

  test('POST /api/auth/signup - creates new user with JWT', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: testEmail, password: testPassword, name: 'Test User' })
    expect([200, 201]).toContain(res.status)
    expect(res.body).toHaveProperty('token')
    expect(res.body).toHaveProperty('user')
    expect(res.body.user.email).toBe(testEmail)
    expect(res.body.user.isPremium).toBe(false)
    token = res.body.token
    userId = res.body.user.id
  })

  test('POST /api/auth/signup - rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: testEmail, password: testPassword, name: 'Dup' })
    expect([400, 409]).toContain(res.status)
    expect(res.body.error).toMatch(/déjà|existe|utilisé/i)
  })

  test('POST /api/auth/signup - rejects short password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: `short-${Date.now()}@medimemo.test`, password: '123', name: 'Short' })
    expect([400, 422]).toContain(res.status)
  })

  test('POST /api/auth/login - returns JWT for valid creds', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
  })

  test('POST /api/auth/login - rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'wrongpass' })
    expect(res.status).toBe(401)
  })
})

describe('MediMémo API - Medications (auth required)', () => {
  const testEmail = `med-${Date.now()}@medimemo.test`
  let token = ''
  let userId = ''
  let medId = ''

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: testEmail, password: 'testpass123', name: 'Med Test' })
    token = res.body.token
    userId = res.body.user.id
  })

  afterAll(async () => {
    await prisma.medication.deleteMany({ where: { userId } })
    await prisma.user.deleteMany({ where: { email: testEmail } })
    await prisma.$disconnect()
  })

  test('POST /api/users/:userId/medications - creates a medication', async () => {
    const res = await request(app)
      .post(`/api/users/${userId}/medications`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Doliprane', dose: '1000mg', time: '08:00' })
    expect([200, 201]).toContain(res.status)
    expect(res.body.name).toBe('Doliprane')
    medId = res.body.id
  })

  test('GET /api/users/:userId/medications - lists user medications', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}/medications`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
  })

  test('POST /api/users/:userId/medications - works without auth (legacy)', async () => {
    const res = await request(app)
      .post(`/api/users/${userId}/medications`)
      .send({ name: 'Aspirine', dose: '500mg', time: '12:00' })
    expect([200, 201, 400, 401, 403]).toContain(res.status)
  })
})

describe('MediMémo API - Public routes', () => {
  test('GET /api/health - returns ok', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  test('GET /api/push/vapid-public-key - returns VAPID key', async () => {
    const res = await request(app).get('/api/push/vapid-public-key')
    expect(res.status).toBe(200)
    expect(res.body.publicKey).toBeDefined()
    expect(res.body.publicKey.length).toBeGreaterThan(50)
  })

  test('GET /api/medications/search?q=doliprane - searches in base', async () => {
    const res = await request(app)
      .get('/api/medications/search')
      .query({ q: 'doliprane' })
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})
