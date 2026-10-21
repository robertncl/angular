import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.robertngo.angular',
  appName: 'Haze Watch',
  webDir: 'dist/angular/browser',
  plugins: {
    // The page is light-only, so the status and navigation bars always need
    // dark icons. DEFAULT follows the device's dark mode and would draw light
    // icons on the white top bar.
    SystemBars: { style: 'LIGHT' }
  }
};

export default config;
