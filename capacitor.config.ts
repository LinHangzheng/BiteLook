import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bitelook.app',
  appName: 'BiteLook',
  webDir: 'out',
  ios: {
    contentInset: 'automatic',
  },
  server: {
    // Allow loading from the deployed backend for API calls
    allowNavigation: ['bitelook.vercel.app'],
  },
};

export default config;
