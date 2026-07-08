// Native bridge — uses Capacitor on mobile, falls back to web API on PWA
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { PushNotifications } from '@capacitor/push-notifications'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { App as CapacitorApp } from '@capacitor/app'

const isNative = Capacitor.isNativePlatform()

// === Local Notifications (native) ===
export async function scheduleNativeReminder(
  title: string,
  body: string,
  hour: number,
  minute: number,
  medId: string
): Promise<void> {
  if (!isNative) return

  // Request permission
  const perm = await LocalNotifications.requestPermissions()
  if (perm.display !== 'granted') return

  await LocalNotifications.schedule({
    notifications: [
      {
        id: Math.floor(Math.random() * 100000),
        title,
        body,
        schedule: {
          on: { hour, minute },
          repeats: true,
        },
        smallIcon: 'ic_stat_icon',
        iconColor: '#0ea5e9',
        sound: 'bell.wav',
        extra: { medId },
      },
    ],
  })
}

export async function cancelAllNativeReminders() {
  if (!isNative) return
  const pending = await LocalNotifications.getPending()
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({
      notifications: pending.notifications.map(n => ({ id: n.id })),
    })
  }
}

// === Push Notifications (native FCM/APNS) ===
export async function registerNativePush(): Promise<string | null> {
  if (!isNative) return null

  return new Promise((resolve) => {
    PushNotifications.requestPermissions().then(async (perm) => {
      if (perm.receive !== 'granted') {
        resolve(null)
        return
      }
      await PushNotifications.register()
      PushNotifications.addListener('registration', (token) => {
        resolve(token.value)
      })
      PushNotifications.addListener('registrationError', () => {
        resolve(null)
      })
    })
  })
}

// === Haptics ===
export async function vibrate(type: 'light' | 'medium' | 'heavy' = 'medium') {
  if (isNative) {
    const style = type === 'light' ? ImpactStyle.Light : type === 'heavy' ? ImpactStyle.Heavy : ImpactStyle.Medium
    await Haptics.impact({ style })
  } else if ('vibrate' in navigator) {
    navigator.vibrate(type === 'heavy' ? 50 : type === 'medium' ? 30 : 10)
  }
}

// === App info (for version display) ===
export async function getAppVersion(): Promise<string> {
  if (isNative) {
    const info = await CapacitorApp.getInfo()
    return info.version
  }
  return 'web'
}

export { isNative }
