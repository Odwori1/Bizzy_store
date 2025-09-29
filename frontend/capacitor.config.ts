import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bizzy.pos',
  appName: 'Bizzy POS',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,  // Allow HTTP for local backend
    allowNavigation: ['localhost:8000', '10.0.2.2:8000']  // Allow backend API calls
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
