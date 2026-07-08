import { PrismaClient } from '@prisma/client'
import { sendPushToUser } from './push'
import { sendMissedDoseAlertToCaregivers } from './sms'

const prisma = new PrismaClient()

// Vérifie les prises et envoie les notifications manquées
// À appeler toutes les 5 minutes via cron
export async function checkMissedDoses() {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const currentTime = now.toTimeString().slice(0, 5) // HH:MM

  const users = await prisma.user.findMany({
    where: { isPremium: true },
    include: {
      medications: true,
      caregivers: { where: { OR: [{ notifySms: true }, { notifyEmail: true }] } }
    }
  })

  const alerts: any[] = []

  for (const user of users) {
    // Médicaments du jour dont l'heure est passée et non pris
    const missedMeds = user.medications.filter(med => {
      return med.time < currentTime && !med.taken
    })

    for (const med of missedMeds) {
      const alreadyNotified = await prisma.notificationLog.findFirst({
        where: {
          userId: user.id,
          medId: med.id,
          scheduledFor: { gte: new Date(today) }
        }
      })

      if (alreadyNotified) continue

      // Log la notification
      const log = await prisma.notificationLog.create({
        data: {
          userId: user.id,
          medId: med.id,
          medName: med.name,
          scheduledFor: now,
          status: 'sent'
        }
      })

      // 1. Push notification à l'utilisateur (rappel direct)
      const pushSent = await sendPushToUser(user.id, {
        title: `Rappel MediMémo : ${med.name}`,
        body: `Vous n'avez pas pris votre ${med.name} (${med.dose}) prévu à ${med.time}.`,
        url: '/',
        tag: `med-${med.id}-${today}`,
      })

      // 2. SMS aux aidants (si activé)
      const smsSent = await sendMissedDoseAlertToCaregivers(
        user.id,
        med.name,
        med.time
      )

      // 3. Email (à brancher SMTP / SendGrid)
      for (const cg of user.caregivers) {
        if (cg.notifyEmail && cg.email) {
          console.log(`[ALERT EMAIL] To ${cg.email}: ${user.name || 'Votre proche'} a oublié ${med.name} (${med.dose})`)
        }
      }

      alerts.push({
        userId: user.id,
        userEmail: user.email,
        medName: med.name,
        medDose: med.dose,
        medTime: med.time,
        pushSent,
        smsSent,
        caregivers: user.caregivers.length
      })
    }
  }

  return { checked: users.length, alertsSent: alerts.length, alerts }
}

// Rapport d'observance mensuel (pour PDF)
export async function getMonthlyReport(userId: string, year: number, month: number) {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const medications = await prisma.medication.findMany({ where: { userId } })
  const logs = await prisma.notificationLog.findMany({
    where: { userId, createdAt: { gte: startDate, lte: endDate } }
  })

  const totalScheduled = medications.length * 30 // approx
  const totalTaken = medications.length * 30 - logs.length
  const adherence = totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 100

  return {
    period: `${month.toString().padStart(2, '0')}/${year}`,
    totalMedications: medications.length,
    totalScheduled,
    totalTaken,
    totalMissed: logs.length,
    adherence,
    medications: medications.map(m => ({ name: m.name, dose: m.dose, time: m.time })),
    missedDetails: logs.map(l => ({
      date: l.createdAt.toISOString().split('T')[0],
      med: l.medName
    }))
  }
}
