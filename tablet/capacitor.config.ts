import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.playapp.trivia',
  appName: 'Trivia',
  webDir: 'dist',
  android: {
    // El juego no usa internet: todo viene dentro del APK.
    allowMixedContent: false,
  },
};

export default config;
