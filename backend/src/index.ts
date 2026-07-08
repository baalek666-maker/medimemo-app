import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

const medicationSchema = z.object({
  name: z.string().min(1),
  dose: z.string().default('1 comprimé'),
  time: z.string().regex(/^\d{2}:\d{2}$/),
})

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'medimemo-backend' })
})

// Get medications for a user
app.get('/api/users/:userId/medications', async (req, res) => {
  try {
    const medications = await prisma.medication.findMany({
      where: { userId: req.params.userId },
      orderBy: { time: 'asc' }
    })
    res.json(medications)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch medications' })
  }
})

// Create medication
app.post('/api/users/:userId/medications', async (req, res) => {
  try {
    const data = medicationSchema.parse(req.body)
    const medication = await prisma.medication.create({
      data: { ...data, userId: req.params.userId }
    })
    res.status(201).json(medication)
  } catch (error) {
    res.status(400).json({ error: 'Invalid medication data' })
  }
})

// Delete medication
app.delete('/api/medications/:id', async (req, res) => {
  try {
    await prisma.medication.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete medication' })
  }
})

// Create user
app.post('/api/users', async (req, res) => {
  try {
    const { email, name } = req.body
    const user = await prisma.user.create({
      data: { email, name }
    })
    res.status(201).json(user)
  } catch (error) {
    res.status(400).json({ error: 'Failed to create user' })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 MediMémo backend running on port ${PORT}`)
})
