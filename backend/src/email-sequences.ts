// Email automation sequences (onboarding drip, win-back, upsell)
// Uses EmailQueue table for scheduled sends

import { PrismaClient } from '@prisma/client'
import { sendEmail } from './email'

const prisma = new PrismaClient()

type EmailTemplate = 'welcome_d1' | 'onboarding_d3' | 'onboarding_d7' | 'upsell_d14' | 'upsell_d30' | 'winback_d60'

interface SequenceStep {
  template: EmailTemplate
  delayHours: number
}

// Each sequence defines the steps to enqueue
const SEQUENCES: Record<string, SequenceStep[]> = {
  onboarding: [
    { template: 'welcome_d1', delayHours: 0 },
    { template: 'onboarding_d3', delayHours: 72 },
    { template: 'onboarding_d7', delayHours: 168 },
    { template: 'upsell_d14', delayHours: 336 },
    { template: 'upsell_d30', delayHours: 720 },
  ],
}

// === Templates ===

const TEMPLATES: Record<EmailTemplate, (data: any) => { subject: string; html: string }> = {
  welcome_d1: (d) => ({
    subject: 'Bienvenue sur MediMemo - votre premier rappel vous attend',
    html: `<div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #0ea5e9; font-size: 28px; margin: 0;">MediMemo</h1>
      </div>
      <div style="background: #f0f9ff; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
        <h2 style="color: #0c4a6e; margin-top: 0;">Bienvenue ${d.name || ''},</h2>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">
          Votre compte est pret. Pour ne plus jamais oublier un medicament, voici les 3 etapes pour demarrer :
        </p>
        <ol style="color: #334155; font-size: 15px; line-height: 1.8;">
          <li>Ajoutez votre premier medicament (nom + heure)</li>
          <li>Autorisez les notifications sur votre telephone</li>
          <li>Invitez un proche ou un aidant en cas d oubli</li>
        </ol>
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://medimemo.fr" style="background: #0ea5e9; color: white; text-decoration: none; font-weight: bold; font-size: 16px; padding: 16px 40px; border-radius: 12px; display: inline-block;">Ajouter mon premier medicament</a>
      </div>
      <p style="color: #94a3b8; font-size: 13px; text-align: center;">MediMemo - Ne ratez plus aucun medicament.</p>
    </div>`,
  }),

  onboarding_d3: (d) => ({
    subject: 'Avez-vous bien ajoute vos medicaments ?',
    html: `<div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <div style="background: #f0fdf4; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
        <h2 style="color: #14532d; margin-top: 0;">Bonjour ${d.name || ''},</h2>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">
          Vous avez cree votre compte MediMemo il y a 3 jours. <br/>
          Savez-vous que <strong>60% des personnes oublient un medicament chaque semaine ?</strong>
        </p>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">
          MediMemo peut vous prevenir automatiquement - et meme prevenir un proche si vous oubliez.
        </p>
      </div>
      <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
        <p style="color: #334155; font-size: 15px;">Si vous n avez pas encore ajoute vos medicaments, faites-le maintenant :</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="https://medimemo.fr" style="background: #0ea5e9; color: white; text-decoration: none; font-weight: bold; font-size: 15px; padding: 14px 32px; border-radius: 12px; display: inline-block;">Configurer mes rappels</a>
        </div>
      </div>
      <p style="color: #94a3b8; font-size: 13px; text-align: center;">MediMemo - Ne ratez plus aucun medicament.</p>
    </div>`,
  }),

  onboarding_d7: (d) => ({
    subject: 'Decouvrez le suivi par SMS - gratuit pour essayer',
    html: `<div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <div style="background: #fff7ed; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
        <h2 style="color: #9a3412; margin-top: 0;">Bonjour ${d.name || ''},</h2>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">
          Avez-vous pense a prevenir un proche en cas d oubli ?<br/>
          MediMemo peut envoyer un <strong>SMS automatique</strong> a un aidant si vous oubliez un medicament.
        </p>
      </div>
      <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
        <h3 style="color: #0c4a6e; margin-top: 0;">Avec Premium (59,99 EUR/an) :</h3>
        <ul style="color: #334155; font-size: 15px; line-height: 1.8;">
          <li>SMS illimites aux aidants</li>
          <li>Rapports PDF d observance</li>
          <li>Suivi multi-proches</li>
          <li>Support prioritaire</li>
        </ul>
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://medimemo.fr" style="background: #f59e0b; color: white; text-decoration: none; font-weight: bold; font-size: 16px; padding: 16px 40px; border-radius: 12px; display: inline-block;">Decouvrir Premium</a>
      </div>
      <p style="color: #94a3b8; font-size: 13px; text-align: center;">MediMemo - Ne ratez plus aucun medicament.</p>
    </div>`,
  }),

  upsell_d14: (d) => ({
    subject: '14 jours sans oubli - passez le niveau superieur',
    html: `<div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <div style="background: #faf5ff; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
        <h2 style="color: #581c87; margin-top: 0;">Felicitations ${d.name || ''},</h2>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">
          Vous utilisez MediMemo depuis 2 semaines.<br/>
          Pour aller plus loin, passez a Premium et profitez de :
        </p>
        <ul style="color: #334155; font-size: 15px; line-height: 1.8;">
          <li>Rapports PDF d observance a partager avec votre medecin</li>
          <li>SMS automatiques aux proches en cas d oubli</li>
          <li>Suivi de plusieurs personnes (parents, conjoint)</li>
        </ul>
      </div>
      <div style="background: white; border: 2px solid #f59e0b; border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: center;">
        <p style="color: #92400e; font-size: 14px; margin: 0;">Offre speciale - 14 jours d essai Premium offerts</p>
        <p style="color: #92400e; font-size: 32px; font-weight: bold; margin: 8px 0;">59,99 EUR/an</p>
        <p style="color: #92400e; font-size: 13px; margin: 0;">soit 5 EUR/mois - annulable a tout moment</p>
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://medimemo.fr" style="background: #f59e0b; color: white; text-decoration: none; font-weight: bold; font-size: 16px; padding: 16px 40px; border-radius: 12px; display: inline-block;">Activer mon essai Premium</a>
      </div>
      <p style="color: #94a3b8; font-size: 13px; text-align: center;">MediMemo - Ne ratez plus aucun medicament.</p>
    </div>`,
  }),

  upsell_d30: (d) => ({
    subject: 'Votre mois gratuit - decouvrez vos statistiques',
    html: `<div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <div style="background: #fef3c7; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
        <h2 style="color: #78350f; margin-top: 0;">${d.name || ''},</h2>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">
          Cela fait un mois que vous suivez vos medicaments avec MediMemo.<br/>
          <strong>Saviez-vous que 80% de nos utilisateurs Premium observent une meilleure observance des le premier mois ?</strong>
        </p>
      </div>
      <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
        <h3 style="color: #0c4a6e; margin-top: 0;">Ce que vous obtenez avec Premium :</h3>
        <ul style="color: #334155; font-size: 15px; line-height: 1.8;">
          <li>Rapport mensuel PDF de votre observance</li>
          <li>Alertes SMS illimitees a vos proches</li>
          <li>Suivi de plusieurs personnes</li>
          <li>Support prioritaire en cas de probleme</li>
        </ul>
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://medimemo.fr" style="background: #0ea5e9; color: white; text-decoration: none; font-weight: bold; font-size: 16px; padding: 16px 40px; border-radius: 12px; display: inline-block;">Passer Premium - 59,99 EUR/an</a>
      </div>
      <p style="color: #94a3b8; font-size: 13px; text-align: center;">MediMemo - Ne ratez plus aucun medicament.</p>
    </div>`,
  }),

  winback_d60: (d) => ({
    subject: 'Vous nous manquez - votre sante compte',
    html: `<div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <div style="background: #fef2f2; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
        <h2 style="color: #991b1b; margin-top: 0;">Bonjour ${d.name || ''},</h2>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">
          Nous avons remarque que vous n avez pas utilise MediMemo depuis un moment.<br/>
          Vos medicaments sont importants - ne les oubliez pas.
        </p>
      </div>
      <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
        <p style="color: #334155; font-size: 15px;">
          Revenez maintenant et beneficiez de <strong>30 jours Premium offerts</strong> pour rediscover MediMemo.
        </p>
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://medimemo.fr" style="background: #0ea5e9; color: white; text-decoration: none; font-weight: bold; font-size: 16px; padding: 16px 40px; border-radius: 12px; display: inline-block;">Revenir sur MediMemo</a>
      </div>
      <p style="color: #94a3b8; font-size: 13px; text-align: center;">MediMemo - Ne ratez plus aucun medicament.</p>
    </div>`,
  }),
}

// === Public API ===

// Enroll a user in an email sequence (e.g. onboarding)
export async function enrollInSequence(
  userId: string,
  email: string,
  name: string | null,
  sequenceName: keyof typeof SEQUENCES
): Promise<void> {
  const steps = SEQUENCES[sequenceName]
  if (!steps) {
    console.error(`[sequences] Unknown sequence: ${sequenceName}`)
    return
  }

  // Avoid duplicate enrollment
  const existing = await prisma.emailQueue.findFirst({
    where: { userId, template: steps[0].template },
  })
  if (existing) {
    console.log(`[sequences] User ${userId} already enrolled in ${sequenceName}`)
    return
  }

  const now = new Date()
  for (const step of steps) {
    const scheduledFor = new Date(now.getTime() + step.delayHours * 3600 * 1000)
    const tpl = TEMPLATES[step.template]
    const payload = { name }

    await prisma.emailQueue.create({
      data: {
        userId,
        email,
        template: step.template,
        payload: JSON.stringify(payload),
        scheduledFor,
      },
    })
  }

  console.log(`[sequences] User ${userId} enrolled in ${sequenceName} (${steps.length} emails scheduled)`)
}

// Process pending emails (call this from a cron endpoint)
export async function processEmailQueue(): Promise<{ sent: number; failed: number; skipped: number }> {
  const now = new Date()
  const pending = await prisma.emailQueue.findMany({
    where: {
      sentAt: null,
      scheduledFor: { lte: now },
      attempts: { lt: 3 },
    },
    take: 50, // batch size
  })

  let sent = 0
  let failed = 0
  let skipped = 0

  for (const item of pending) {
    const tpl = TEMPLATES[item.template as EmailTemplate]
    if (!tpl) {
      console.error(`[sequences] Unknown template: ${item.template}`)
      await prisma.emailQueue.update({
        where: { id: item.id },
        data: { error: 'Unknown template', attempts: { increment: 1 } },
      })
      skipped++
      continue
    }

    const data = JSON.parse(item.payload || '{}')
    const { subject, html } = tpl(data)

    const ok = await sendEmail(item.email, subject, html)
    if (ok) {
      await prisma.emailQueue.update({
        where: { id: item.id },
        data: { sentAt: new Date() },
      })
      sent++
    } else {
      await prisma.emailQueue.update({
        where: { id: item.id },
        data: { error: 'Send failed', attempts: { increment: 1 } },
      })
      failed++
    }
  }

  console.log(`[sequences] Processed: ${sent} sent, ${failed} failed, ${skipped} skipped`)
  return { sent, failed, skipped }
}

// Cancel pending emails for a user (e.g. on account deletion or premium purchase)
export async function cancelPendingEmails(userId: string, templates?: string[]): Promise<void> {
  await prisma.emailQueue.deleteMany({
    where: {
      userId,
      sentAt: null,
      ...(templates ? { template: { in: templates } } : {}),
    },
  })
}
