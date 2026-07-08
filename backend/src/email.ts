// Transactional emails via Resend
// Falls back to console.log if RESEND_API_KEY is not set
import { Resend } from 'resend'

let client: Resend | null = null
const FROM = process.env.EMAIL_FROM || 'MediMémo <noreply@medimemo.fr>'

function getClient(): Resend | null {
  if (client) return client
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  client = new Resend(key)
  return client
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const resend = getClient()
  if (!resend) {
    console.log(`[email] To: ${to} | Subject: ${subject}`)
    console.log(`[email] HTML: ${html.substring(0, 200)}...`)
    return true
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html })
    if (error) {
      console.error('[email] Resend error:', error)
      return false
    }
    return true
  } catch (e) {
    console.error('[email] Send failed:', e)
    return false
  }
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const html = `
  <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #0ea5e9; font-size: 28px; margin: 0;">MediMémo 💊</h1>
      <p style="color: #64748b; font-size: 16px; margin-top: 8px;">Bienvenue, ${name} !</p>
    </div>
    <div style="background: #f0f9ff; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
      <h2 style="color: #0c4a6e; margin-top: 0;">Votre compte est créé ✓</h2>
      <p style="color: #334155; font-size: 16px; line-height: 1.6;">
        Vous pouvez maintenant ajouter vos médicaments, configurer vos rappels
        et prévenir vos aidants en cas d'oubli.
      </p>
    </div>
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
      <h3 style="color: #0c4a6e; margin-top: 0;">⚡ Pour bien démarrer :</h3>
      <ol style="color: #334155; font-size: 15px; line-height: 1.8; padding-left: 20px;">
        <li>Ajoutez votre premier médicament</li>
        <li>Activez les notifications dans votre téléphone</li>
        <li>Invitez un aidant (famille, proche)</li>
        <li>Découvrez Premium : rapports PDF, SMS illimités</li>
      </ol>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://medimemo.fr" style="background: #0ea5e9; color: white; text-decoration: none; font-weight: bold; font-size: 16px; padding: 16px 40px; border-radius: 12px; display: inline-block;">Ouvrir MediMémo</a>
    </div>
    <p style="color: #94a3b8; font-size: 13px; text-align: center; margin-top: 40px;">
      MediMémo — Ne ratez plus aucun médicament.<br/>
      Vous recevez cet email car vous avez créé un compte sur medimemo.fr
    </p>
  </div>
  `
  await sendEmail(email, 'Bienvenue sur MediMémo 💊', html)
}

export async function sendPremiumConfirmationEmail(email: string, name: string): Promise<void> {
  const html = `
  <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #f59e0b; font-size: 28px; margin: 0;">Premium activé ⭐</h1>
    </div>
    <div style="background: #fffbeb; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
      <p style="color: #78350f; font-size: 16px; line-height: 1.6;">
        Bonjour ${name},<br/><br/>
        Votre abonnement MediMémo Premium est actif.<br/>
        Profitez de toutes les fonctionnalités premium :
      </p>
      <ul style="color: #78350f; font-size: 15px; line-height: 1.8;">
        <li>✅ SMS illimités aux aidants</li>
        <li>✅ Rapports PDF d'observance</li>
        <li>✅ Suivi multi-résidents (EHPAD)</li>
        <li>✅ Support prioritaire</li>
      </ul>
    </div>
    <p style="color: #94a3b8; font-size: 13px; text-align: center;">
      Merci de votre confiance. MediMémo — 59,99€/an.
    </p>
  </div>
  `
  await sendEmail(email, 'Premium activé — Merci de votre confiance ⭐', html)
}

export async function sendMissedDoseEmail(email: string, residentName: string, medicationName: string): Promise<void> {
  const html = `
  <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: #fef2f2; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
      <h2 style="color: #dc2626; margin-top: 0;">⚠️ Prise manquée détectée</h2>
      <p style="color: #7f1d1d; font-size: 16px; line-height: 1.6;">
        <strong>${residentName}</strong> n'a pas confirmé la prise de<br/>
        <strong>${medicationName}</strong><br/><br/>
        N'hésitez pas à contacter la personne pour vérifier que tout va bien.
      </p>
    </div>
    <p style="color: #94a3b8; font-size: 13px; text-align: center;">
      MediMémo — Veille sur vos proches.
    </p>
  </div>
  `
  await sendEmail(email, `⚠️ ${residentName} — prise manquée`, html)
}
