import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'Mobilify',
  webDir: 'dist',
  plugins: {
    SystemBars: {
      insetsHandling: "css",
      style: "LIGHT",
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: "#863BFF",
      showSpinner: false,
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true
    }
  },
};

export default config;
