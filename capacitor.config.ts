import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";

const config: CapacitorConfig = {
  appId: "io.keithlodom.klo",
  appName: "KLO",
  webDir: "out",

  server: {
    url: "https://keithlodom.ai",
    cleartext: false,
  },

  ios: {
    scheme: "KLO",
    contentInset: "always",
    backgroundColor: "#0D1117",
    allowsLinkPreview: false,
  },

  android: {
    allowMixedContent: false,
  },

  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 8000,
      launchFadeOutDuration: 300,
      backgroundColor: "#0D1117",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0D1117",
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
