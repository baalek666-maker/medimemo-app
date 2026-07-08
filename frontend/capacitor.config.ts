import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'fr.medimemo.app',
  appName: 'MediMémo',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#0ea5e9',
      sound: 'bell.wav'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#ffffff'
  },
  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: false
  }
}

export default config
