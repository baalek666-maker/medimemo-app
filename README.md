# MediMemo

Application de rappels de medicaments pour seniors et aidants en France.

Copie en mieux de Medisafe / MyTherapy, ciblee sur le marche francais avec un angle emotionnel (peur d'oubli, tranquilite des aidants) et une monetisation premium agressive.

## Marche

- **Concurrents prouves** : Medisafe (100M+ users, $30M+ ARR), MyTherapy (50M+ downloads), Pill Reminder
- **Cible FR** : 20M+ de personnes sous traitement chronique, 4M+ d'aidants familiaux
- **Monetisation** : B2C Premium 59,99 EUR/an · B2B EHPAD 3 EUR/resident/mois

## Stack technique

| Couche | Techno |
|--------|--------|
| Frontend | React 18 + Vite + Tailwind CSS + TypeScript |
| Backend | Node.js + Express + Prisma ORM |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Mobile | PWA + Capacitor (iOS/Android) |
| Paiement | Stripe (abonnement annuel) |
| Notifications | Web Push (VAPID) + SMS Twilio |
| Email | Resend (automation sequences) |
| Analytics | Posthog (avec A/B testing) |

## Demarrage rapide

### Prerequis

- Node.js 20+
- npm

### Backend

```bash
cd backend
npm install
npx prisma db push
npm run dev  # http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

### Tests

```bash
cd backend
npx jest --forceExit  # 20 tests (11 unitaires + 9 E2E)
```

## Architecture

```
medimemo-app/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # 13 modeles (User, Medication, Intake, etc.)
│   ├── src/
│   │   ├── app.ts              # Express routes (auth, meds, admin, cron, RGPD)
│   │   ├── auth.ts             # JWT auth + signup enrollment
│   │   ├── stripe.ts           # Stripe webhooks + checkout
│   │   ├── email.ts            # Resend transactional
│   │   ├── email-sequences.ts  # Onboarding drip, upsell, win-back
│   │   ├── push.ts             # VAPID web push
│   │   ├── sms.ts              # Twilio SMS aux aidants
│   │   └── analytics.ts        # Posthog tracking
│   └── tests/
│       ├── auth.test.ts        # 11 tests unitaires
│       └── e2e.test.ts         # 9 tests E2E (signup -> premium -> RGPD)
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Routing principal + landing + home + add
│   │   ├── Onboarding.tsx      # 6 ecrans guidees
│   │   ├── Paywall.tsx         # A/B test pricing (59,99 vs 39,99 vs 79,99)
│   │   ├── Settings.tsx        # RGPD export/suppression
│   │   ├── AdminDashboard.tsx  # Dashboard admin (/admin)
│   │   ├── B2B.tsx             # Landing EHPAD + demo
│   │   ├── Referral.tsx        # Parrainage + affiliation
│   │   ├── LandingPages.tsx    # 7 pages SEO programmatiques
│   │   ├── Legal.tsx           # CGV, CGU, mentions, privacy, contact
│   │   ├── api.ts              # API client
│   │   ├── experiments.ts      # A/B testing framework
│   │   └── sw.ts               # Service worker (push notifications)
│   ├── public/
│   │   ├── sitemap.xml
│   │   ├── robots.txt
│   │   └── manifest.json
│   └── index.html              # SEO meta + Open Graph + JSON-LD
│
├── Dockerfile                  # Multi-stage (backend + frontend nginx)
├── nginx.conf                  # SPA routing + cache
├── render.yaml                 # Deploy Render (API + static + PostgreSQL)
└── .env.example                # Template variables environnement
```

## Fonctionnalites

### B2C (seniors + aidants)
- Gestion medicaments (nom, dosage, frequence, horaires)
- Rappels push + SMS aux aidants en cas d'oubli
- Suivi d'observance (stats adherence)
- Export PDF rapport (partage medecin/pharmacien)
- Onboarding 6 etapes
- Mode aidant familial (compte lie)

### B2B (EHPAD + cliniques)
- Gestion multi-residents
- Dashboard personel soignant
- 3 EUR/resident/mois

### Growth
- Parrainage (1 mois premium offert)
- Affiliation (30% commission)
- Gamification (badges adherence)
- A/B testing (pricing, CTA, landing)
- 7 pages SEO programmatiques

### Automation
- Email drip onboarding (J+1, J+3, J+7)
- Email upsell premium (J+14, J+30)
- Email win-back inactifs (J+60)
- Auto-annulation a la conversion premium

### Conformite
- RGPD : export + suppression donnees
- Pages legales (CGV, CGU, mentions, privacy)
- Politique cookies
- Hebergement conforme (Stripe, Resend, Twilio, Posthog)

## Deploiement

### Render (recommande)

1. Connecter le repo GitHub sur Render
2. Detect automatique via `render.yaml`
3. Configurer les variables d'environnement (voir `.env.example`)
4. Deploy

### Docker

```bash
docker build --target backend -t medimemo-api .
docker build --target frontend -t medimemo-web .
```

## Variables environnement

Voir `.env.example` pour la liste complete.

Cles obligatoires en production :
- `DATABASE_URL` (PostgreSQL)
- `JWT_SECRET`
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY`
- `ADMIN_TOKEN`

## Routeur admin

Dashboard admin accessible sur `/admin` avec le token `ADMIN_TOKEN`.

## Licence

Prive. Tous droits reserves. (c) 2025-2026 MediMemo.
