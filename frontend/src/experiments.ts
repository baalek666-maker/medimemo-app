// === A/B Testing Framework ===
// Uses PostHog feature flags for server-side experiments
// Falls back to deterministic bucketing if PostHog is unavailable

const EXPERIMENTS: Record<string, {
  name: string
  variants: { key: string; label: string; weight: number }[]
  description: string
}> = {
  // Landing page CTA copy
  landing_cta: {
    name: 'Landing CTA Text',
    description: 'Test different call-to-action copy on the landing page',
    variants: [
      { key: 'control', label: 'Commencer gratuitement', weight: 50 },
      { key: 'urgency', label: 'Ne plus jamais oublier mes medicaments', weight: 50 },
    ],
  },
  // Premium pricing display
  premium_pricing: {
    name: 'Premium Pricing Display',
    description: 'Test monthly vs annual pricing emphasis',
    variants: [
      { key: 'control', label: 'Annual 59.99€ upfront', weight: 50 },
      { key: 'monthly', label: '5.99€/mois (engage 1 an)', weight: 50 },
    ],
  },
  // Signup flow
  signup_flow: {
    name: 'Signup Flow',
    description: 'Test single-step vs multi-step signup',
    variants: [
      { key: 'control', label: 'Email + password single form', weight: 50 },
      { key: 'magic', label: 'Magic link (email only)', weight: 50 },
    ],
  },
  // Reminder notification wording
  reminder_wording: {
    name: 'Reminder Notification',
    description: 'Test reminder notification copy tone',
    variants: [
      { key: 'control', label: 'C est l heure de prendre {med}', weight: 33 },
      { key: 'friendly', label: 'C est le moment de prendre {med} !', weight: 33 },
      { key: 'caring', label: 'Votre sante compte : prenez {med} maintenant', weight: 34 },
    ],
  },
}

// Deterministic hash for stable bucketing per user
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

// Get user bucket for an experiment
export function getVariant(experimentKey: string, userId?: string): string {
  const experiment = EXPERIMENTS[experimentKey]
  if (!experiment) return 'control'

  // Try PostHog feature flag first
  if (typeof window !== 'undefined' && (window as any).posthog) {
    const flag = (window as any).posthog.getFeatureFlag(experimentKey)
    if (flag) return flag
  }

  // Fallback: deterministic bucketing
  const seed = userId || (typeof window !== 'undefined' ? window.localStorage.getItem('medimemo_userId') || 'anonymous' : 'anonymous')
  const hash = hashString(`${seed}-${experimentKey}`)
  const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0)
  let bucket = hash % totalWeight

  for (const variant of experiment.variants) {
    bucket -= variant.weight
    if (bucket < 0) return variant.key
  }

  return experiment.variants[0].key
}

// Get the label for the variant
export function getVariantLabel(experimentKey: string, variantKey: string): string {
  const experiment = EXPERIMENTS[experimentKey]
  if (!experiment) return ''
  return experiment.variants.find((v) => v.key === variantKey)?.label || ''
}

// Track experiment exposure (call once per variant assignment)
export function trackExposure(experimentKey: string, variantKey: string) {
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture('$experiment_started', {
      $experiment_name: experimentKey,
      $variant: variantKey,
    })
  }
}

// Get CTA text based on experiment
export function getLandingCta(userId?: string): string {
  const variant = getVariant('landing_cta', userId)
  trackExposure('landing_cta', variant)
  if (variant === 'urgency') return 'Ne plus jamais oublier mes medicaments'
  return 'Commencer gratuitement'
}

// Get premium pricing display based on experiment
export function getPremiumDisplay(userId?: string): 'annual' | 'monthly' {
  const variant = getVariant('premium_pricing', userId)
  trackExposure('premium_pricing', variant)
  return variant === 'monthly' ? 'monthly' : 'annual'
}

export { EXPERIMENTS as EXPERIMENT_CONFIG }
