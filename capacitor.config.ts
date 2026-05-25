import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pocketify.app',
  appName: 'Pocketify',
  webDir: 'dist',
  plugins: {
    SystemBars: {
      insetsHandling: 'css',
      style: 'LIGHT'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: false,
      launchFadeOutDuration: 500,
      backgroundColor: '#863BFF',
      showSpinner: false
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    CapacitorUpdater: {
      version: '1.0.0',
      appId: 'com.pocketify.app',
      autoUpdate: 'always',
      autoSplashscreen: true
    }
  }
};

export default config;
