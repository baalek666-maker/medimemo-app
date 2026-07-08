// SMS module - Twilio (avec fallback console pour dev)
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SmsResult {
  sent: boolean
  to: string
  provider: 'twilio' | 'console'
  error?: string
}

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_FROM = process.env.TWILIO_FROM_NUMBER

async function sendTwilioSms(to: string, body: string): Promise<SmsResult> {
  // Lazy import to avoid loading twilio when not configured
  const twilio = await import('twilio' as any).catch(() => null)
  if (!twilio || !TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
    console.log(`[SMS-DEV] To: ${to} | Body: ${body}`)
    return { sent: true, to, provider: 'console' }
  }
  try {
    const client = twilio.default(TWILIO_SID, TWILIO_TOKEN)
    await client.messages.create({ to, from: TWILIO_FROM, body })
    return { sent: true, to, provider: 'twilio' }
  } catch (e: any) {
    console.error('[SMS] Twilio error:', e.message)
    return { sent: false, to, provider: 'twilio', error: e.message }
  }
}

export async function sendSmsToCaregiver(caregiverId: string, body: string): Promise<SmsResult | null> {
  const caregiver = await prisma.caregiver.findUnique({ where: { id: caregiverId } })
  if (!caregiver || !caregiver.phone || !caregiver.notifySms) return null

  return sendTwilioSms(caregiver.phone, body)
}

export async function sendMissedDoseAlertToCaregivers(userId: string, medName: string, scheduledTime: string): Promise<number> {
  const caregivers = await prisma.caregiver.findMany({
    where: { userId, notifySms: true }
  })
  if (caregivers.length === 0) return 0

  const body = `MediMémo : votre proche n'a pas pris ${medName} (prévu à ${scheduledTime}). Merci de vérifier.`
  let sent = 0
  for (const cg of caregivers) {
    if (cg.phone) {
      const r = await sendTwilioSms(cg.phone, body)
      if (r.sent) sent++
    }
  }
  return sent
}
