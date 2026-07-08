// Server-side Posthog for backend events
import { PostHog } from 'posthog-node'

let client: PostHog | null = null

export function getPosthog(): PostHog | null {
  if (client) return client
  const key = process.env.POSTHOG_KEY
  if (!key) return null
  client = new PostHog(key, { host: 'https://eu.i.posthog.com' })
  return client
}

export function trackServer(event: string, properties?: Record<string, any>) {
  const ph = getPosthog()
  if (!ph) {
    console.log(`[analytics] ${event}`, properties)
    return
  }
  ph.capture({
    distinctId: properties?.distinctId || 'anonymous',
    event,
    properties: { ...properties, $lib: 'posthog-node' },
  })
}

export async function flushAnalytics() {
  const ph = getPosthog()
  if (ph) await ph.shutdown()
}
