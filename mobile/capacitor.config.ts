import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.medimemo.app',
  appName: 'MediMémo',
  webDir: '../frontend/dist',
  server: {
    androidScheme: 'https'
  }
}

export default config
