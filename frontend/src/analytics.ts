// Posthog analytics wrapper — initialized lazily
import posthog from 'posthog-js'

let initialized = false

export function initAnalytics() {
  if (initialized) return
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined
  if (!key) {
    console.log('[analytics] Posthog key not set — skipping init')
    return
  }
  posthog.init(key, {
    api_host: 'https://eu.i.posthog.com',
    autocapture: true,
    persistence: 'localStorage',
    mask_all_text: false,
  })
  initialized = true
}

export function track(event: string, properties?: Record<string, any>) {
  if (!initialized) return
  posthog.capture(event, properties)
}

export function identifyUser(userId: string, traits?: Record<string, any>) {
  if (!initialized) return
  posthog.identify(userId, traits)
}

export function resetAnalytics() {
  if (!initialized) return
  posthog.reset()
}

export default posthog
