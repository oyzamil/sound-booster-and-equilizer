/**
 * Handler for extension installation and updates
 */
const DEFAULT_CONFIG = {
  tab: {
    id: null,
    url: null,
  },
  instance: false,
  installDate: new Date().getTime(),
  volume: 1,
  balance: 0,
  isPitch: false,
  isMono: false,
  isInvert: false,
  isChorus: false,
  isConvolver: false,
  isCompressor: false,
  compressor: {
    threshold: -50,
    knee: 40,
    ratio: 12,
    attack: 0,
    release: 0.25,
    makeupGain: 1,
    bypass: false,
    automakeup: false,
  },
  chorus: {
    depth: 0,
    rate: 0,
    feedback: 0,
    delay: 0,
    bypass: false,
  },
  convolver: {
    highCut: 22050,
    lowCut: 20,
    dryLevel: 1,
    wetLevel: 0,
    level: 0,
    bypass: false,
  },
  pitch: {
    name: 'pitch',
    isEnable: false,
    params: [
      {
        name: 'pitch',
        min: 0,
        max: 10,
        value: 0,
        step: 0.01,
        translate: 'labelPitch',
        showValue: true,
      },
    ],
  },
  eq: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  presets: [
    { key: 'default', name: 'defaultPreset', eq: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { key: 'acoustic', name: 'presetAcoustic', eq: [15, 15, 10, 4, 7, 7, 10, 12, 10, 5] },
    { key: 'bassBooster', name: 'presetBassBooster', eq: [15, 12, 10, 7, 3, 0, 0, 0, 0, 0] },
    { key: 'bassReducer', name: 'presetBassReducer', eq: [-15, -12, -10, -8, -5, 0, 0, 7, 10, 12] },
    { key: 'classical', name: 'presetClassical', eq: [15, 12, 10, 8, -5, -5, 0, 7, 10, 12] },
    { key: 'dance', name: 'presetDance', eq: [12, 22, 15, 0, 5, 10, 16, 15, 12, 0] },
    { key: 'deep', name: 'presetDeep', eq: [15, 12, 5, 3, 10, 8, 5, -6, -12, -15] },
    { key: 'electronic', name: 'presetElectronic', eq: [14, 13, 4, 0, -6, 6, 3, 4, 13, 15] },
    { key: 'hiphop', name: 'presetHipHop', eq: [16, 14, 4, 10, -4, -3, 4, -2, 6, 10] },
    { key: 'jazz', name: 'presetJazz', eq: [13, 10, 4, 6, -5, -5, 0, 4, 10, 13] },
    { key: 'latin', name: 'presetLatin', eq: [9, 5, 0, 0, -5, -5, -5, 0, 10, 15] },
    { key: 'loudness', name: 'presetLoudness', eq: [20, 14, 0, 0, -6, 0, -2, -18, 16, 3] },
    { key: 'lounge', name: 'presetLounge', eq: [-10, -5, -2, 4, 13, 4, 0, -5, 6, 3] },
    { key: 'piano', name: 'presetPiano', eq: [10, 6, 0, 9, 10, 5, 11, 15, 10, 11] },
    { key: 'pop', name: 'presetPop', eq: [-5, -4, 0, 6, 15, 13, 6, 0, -3, -5] },
    { key: 'rnb', name: 'presetRnb', eq: [9, 23, 19, 4, -8, -5, 8, 9, 10, 12] },
    { key: 'rock', name: 'presetRock', eq: [16, 13, 10, 4, -1, -2, 1, 8, 11, 15] },
    {
      key: 'smallSpeakers',
      name: 'presetSmallSpeakers',
      eq: [18, 14, 13, 8, 4, 0, -4, -9, -11, -14],
    },
    { key: 'spokenWord', name: 'presetSpokenWord', eq: [-7, -1, 0, 2, 12, 15, 16, 14, 8, 0] },
    { key: 'trebleBooster', name: 'presetTrebleBooster', eq: [0, 0, 0, 0, 0, 3, 8, 12, 14, 17] },
    {
      key: 'trebleReducer',
      name: 'presetTrebleReducer',
      eq: [0, 0, 0, 0, 0, -3, -8, -12, -14, -17],
    },
    {
      key: 'vocalBooster',
      name: 'presetVocalBooster',
      eq: [-5, -10, -10, 4, 12, 12, 10, 5, 0, -5],
    },
  ],
};

/**
 * Initialize default configuration
 */
const initializeConfig = async () => {
  try {
    browser.storage.local.set(DEFAULT_CONFIG);
  } catch (error) {
    console.error('Error initializing config:', error);
  }
};

/**
 * Handle extension installation
 */
export const handleInstall = async (details) => {
  if (import.meta.env.PROD) {
    browser.tabs.create({
      url: `https://muzammil.work?event=${getPackageProp('name')}-${details.reason}`,
    });
  }
  if (details.reason === browser.runtime.OnInstalledReason.INSTALL) {
    await initializeConfig();
  } else if (details.reason === browser.runtime.OnInstalledReason.UPDATE) {
    await initializeConfig();
  }
};
