import { defineAppConfig } from 'wxt/utils/define-app-config';

export const DEFAULT_BANDS: EQBand[] = [
  { frequency: 60, gain: 0, label: '60Hz' },
  { frequency: 170, gain: 0, label: '170Hz' },
  { frequency: 310, gain: 0, label: '310Hz' },
  { frequency: 600, gain: 0, label: '600Hz' },
  { frequency: 1000, gain: 0, label: '1kHz' },
  { frequency: 3000, gain: 0, label: '3kHz' },
  { frequency: 6000, gain: 0, label: '6kHz' },
  { frequency: 12000, gain: 0, label: '12kHz' },
  { frequency: 14000, gain: 0, label: '14kHz' },
  { frequency: 16000, gain: 0, label: '16kHz' },
];

export const config = {
  APP: {
    color: '#f97316',
    font: 'Poppins',
    storageBucket: 'sound-booster-and-equilizer-data',
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
    enabled: false as boolean,
    volume: 1 as number,
    bands: DEFAULT_BANDS,
    stereoMode: 'stereo' as 'stereo' | 'mono',
    invertChannels: false as boolean,
    balance: 0 as number,
    activePresetId: null as null | string,
    presets: [
      {
        id: 'flat',
        name: 'Flat',
        isCustom: false,
        settings: {
          volume: 1,
          bands: DEFAULT_BANDS,
          stereoMode: 'stereo',
          invertChannels: false,
          balance: 0,
        },
      },
      {
        id: 'bass-boost',
        name: 'Bass Boost',
        isCustom: false,
        settings: {
          volume: 1,
          bands: [
            { frequency: 60, gain: 8, label: '60Hz' },
            { frequency: 170, gain: 6, label: '170Hz' },
            { frequency: 310, gain: 4, label: '310Hz' },
            { frequency: 600, gain: 2, label: '600Hz' },
            { frequency: 1000, gain: 0, label: '1kHz' },
            { frequency: 3000, gain: 0, label: '3kHz' },
            { frequency: 6000, gain: 0, label: '6kHz' },
            { frequency: 12000, gain: 0, label: '12kHz' },
            { frequency: 14000, gain: 0, label: '14kHz' },
            { frequency: 16000, gain: 0, label: '16kHz' },
          ],
          stereoMode: 'stereo',
          invertChannels: false,
          balance: 0,
        },
      },
      {
        id: 'treble-boost',
        name: 'Treble Boost',
        isCustom: false,
        settings: {
          volume: 1,
          bands: [
            { frequency: 60, gain: 0, label: '60Hz' },
            { frequency: 170, gain: 0, label: '170Hz' },
            { frequency: 310, gain: 0, label: '310Hz' },
            { frequency: 600, gain: 0, label: '600Hz' },
            { frequency: 1000, gain: 0, label: '1kHz' },
            { frequency: 3000, gain: 2, label: '3kHz' },
            { frequency: 6000, gain: 4, label: '6kHz' },
            { frequency: 12000, gain: 6, label: '12kHz' },
            { frequency: 14000, gain: 7, label: '14kHz' },
            { frequency: 16000, gain: 8, label: '16kHz' },
          ],
          stereoMode: 'stereo',
          invertChannels: false,
          balance: 0,
        },
      },
      {
        id: 'vocal-boost',
        name: 'Vocal Boost',
        isCustom: false,
        settings: {
          volume: 1,
          bands: [
            { frequency: 60, gain: -2, label: '60Hz' },
            { frequency: 170, gain: -1, label: '170Hz' },
            { frequency: 310, gain: 2, label: '310Hz' },
            { frequency: 600, gain: 4, label: '600Hz' },
            { frequency: 1000, gain: 5, label: '1kHz' },
            { frequency: 3000, gain: 4, label: '3kHz' },
            { frequency: 6000, gain: 2, label: '6kHz' },
            { frequency: 12000, gain: 0, label: '12kHz' },
            { frequency: 14000, gain: 0, label: '14kHz' },
            { frequency: 16000, gain: 0, label: '16kHz' },
          ],
          stereoMode: 'stereo',
          invertChannels: false,
          balance: 0,
        },
      },
      {
        id: 'cinema',
        name: 'Cinema',
        isCustom: false,
        settings: {
          volume: 1.2,
          bands: [
            { frequency: 60, gain: 6, label: '60Hz' },
            { frequency: 170, gain: 4, label: '170Hz' },
            { frequency: 310, gain: 2, label: '310Hz' },
            { frequency: 600, gain: 0, label: '600Hz' },
            { frequency: 1000, gain: 0, label: '1kHz' },
            { frequency: 3000, gain: 2, label: '3kHz' },
            { frequency: 6000, gain: 3, label: '6kHz' },
            { frequency: 12000, gain: 4, label: '12kHz' },
            { frequency: 14000, gain: 3, label: '14kHz' },
            { frequency: 16000, gain: 2, label: '16kHz' },
          ],
          stereoMode: 'stereo',
          invertChannels: false,
          balance: 0,
        },
      },
    ] as Preset[],
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
