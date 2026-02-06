export const DEFAULT_VOLUME = 1;
export const MIN_EQ_VALUE = -20;
export const MAX_EQ_VALUE = 20;
export const DEFAULT_COMPRESSOR_KNEE = 4;
export const DEFAULT_COMPRESSOR_RELEASE = 0.2;
export const DEFAULT_COMPRESSOR_RATIO = 10;
export const DEFAULT_FADER_VALUE = 0;
export const DEFAULT_PRESET_LABEL = 'Presets';
export const DEFAULT_PAN_VALUE = 0;

export const EQ_BANDS = [
  { id: 'twenty', label: '32', frequency: '32 Hz' },
  { id: 'fifty', label: '64', frequency: '64 Hz' },
  { id: 'oneHundred', label: '125', frequency: '125 Hz' },
  { id: 'twoHundred', label: '250', frequency: '250 Hz' },
  { id: 'fiveHundred', label: '500', frequency: '500 Hz' },
  { id: 'oneThousand', label: '1k', frequency: '1 kHz' },
  { id: 'twoThousand', label: '2k', frequency: '2 kHz' },
  { id: 'fiveThousand', label: '4k', frequency: '4 kHz' },
  { id: 'tenThousand', label: '8k', frequency: '8 kHz' },
  { id: 'twentyThousand', label: '16k', frequency: '16 kHz' },
] as const;

export const EQ_PRESETS: Record<string, number[]> = {
  acoustic: [15, 15, 10, 4, 7, 7, 10, 12, 10, 5],
  bassBooster: [15, 12, 10, 7, 3, 0, 0, 0, 0, 0],
  bassReducer: [-15, -12, -10, -8, -5, 0, 0, 7, 10, 12],
  classical: [15, 12, 10, 8, -5, -5, 0, 7, 10, 12],
  dance: [12, 18, 15, 0, 5, 10, 16, 15, 12, 0],
  deep: [15, 12, 5, 3, 10, 8, 5, -6, -12, -15],
  electronic: [14, 13, 4, 0, -6, 6, 3, 4, 13, 15],
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  hiphop: [16, 14, 4, 10, -4, -3, 4, -2, 6, 10],
  jazz: [13, 10, 4, 6, -5, -5, 0, 4, 10, 13],
  latin: [9, 5, 0, 0, -5, -5, -5, 0, 10, 15],
  loudness: [18, 14, 0, 0, -6, 0, -2, -18, 16, 3],
  lounge: [-10, -5, -2, 4, 13, 4, 0, -5, 6, 3],
  piano: [10, 6, 0, 9, 10, 5, 11, 15, 10, 11],
  pop: [-5, -4, 0, 6, 15, 13, 6, 0, -3, -5],
  rnb: [9, 18, 16, 4, -8, -5, 8, 9, 10, 12],
  rock: [16, 13, 10, 4, -1, -2, 1, 8, 11, 15],
  smallSpeakers: [18, 14, 13, 8, 4, 0, -4, -9, -11, -14],
  spokenWord: [-7, -1, 0, 2, 12, 12, 14, 12, 8, 0],
  trebleBooster: [0, 0, 0, 0, 0, 3, 8, 12, 14, 17],
  trebleReducer: [0, 0, 0, 0, 0, -3, -8, -12, -14, -17],
  vocalBooster: [-5, -10, -10, 4, 12, 12, 10, 5, 0, -5],
};

export const PRESET_OPTIONS = [
  { value: 'acoustic', label: 'Acoustic' },
  { value: 'bassBooster', label: 'Bass Booster' },
  { value: 'bassReducer', label: 'Bass Reducer' },
  { value: 'classical', label: 'Classical' },
  { value: 'dance', label: 'Dance' },
  { value: 'deep', label: 'Deep' },
  { value: 'electronic', label: 'Electronic' },
  { value: 'flat', label: 'Flat' },
  { value: 'hiphop', label: 'Hiphop' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'latin', label: 'Latin' },
  { value: 'loudness', label: 'Loudness' },
  { value: 'lounge', label: 'Lounge' },
  { value: 'piano', label: 'Piano' },
  { value: 'pop', label: 'Pop' },
  { value: 'rnb', label: 'RnB' },
  { value: 'rock', label: 'Rock' },
  { value: 'smallSpeakers', label: 'Small Speakers' },
  { value: 'spokenWord', label: 'Spoken Word' },
  { value: 'trebleBooster', label: 'Treble Booster' },
  { value: 'trebleReducer', label: 'Treble Reducer' },
  { value: 'vocalBooster', label: 'Vocal Booster' },
];
