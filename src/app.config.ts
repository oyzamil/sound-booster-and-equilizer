import { defineAppConfig } from 'wxt/utils/define-app-config';

export const config = {
  APP: {
    color: '#f97316',
    font: 'Poppins',
    storageBucket: 'sound-booster-and-equilizer-settings',
    extensionPage: 'https://muzammil.work/?utm_source=',
  },
  SETTINGS: {
    theme: 'dark' as Theme,
    licenseModalVisible: false,
    licenseInfo: {
      email: null as string | null,
      isLicensed: false,
      licenseKey: null as null | string,
      verificationDate: '' as string | number,
      consecutiveFailures: 0 as number,
      subscriptionId: null as null | string,
      subscriptionStatus: 'inactive',
      lastSuccessfulCheck: '' as string,
      error: '' as string,
    },
    compressorCollapsed: true as boolean,
  },
  ROUTES: {
    HOME: '/',
    LOGIN: '/login',
  },
  GUMROAD: {
    GUMROAD_PRODUCT_ID: '',
    GUMROAD_URL: '',
  },
};

export default defineAppConfig(config);

export type Settings = typeof config.SETTINGS;

declare module 'wxt/utils/define-app-config' {
  export interface WxtAppConfig {
    APP: typeof config.APP;
    SETTINGS: typeof config.SETTINGS;
    ROUTES: typeof config.ROUTES;
    GUMROAD: typeof config.GUMROAD;
  }
}
