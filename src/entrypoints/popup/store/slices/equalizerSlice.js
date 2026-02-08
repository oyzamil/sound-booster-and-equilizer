import { createSlice } from '@reduxjs/toolkit';
import logger from '../../utils/logger';
import { loadInitialData } from '../thunks/audioThunks';

const systemPresets = [
  { key: 'default', name: 'default', eq: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { key: 'acoustic', name: 'Acoustic', eq: [15, 15, 10, 4, 7, 7, 10, 12, 10, 5] },
  { key: 'bassBooster', name: 'Bass Booster', eq: [15, 12, 10, 7, 3, 0, 0, 0, 0, 0] },
  { key: 'bassReducer', name: 'Bass Reducer', eq: [-15, -12, -10, -8, -5, 0, 0, 7, 10, 12] },
  { key: 'classical', name: 'Classical', eq: [15, 12, 10, 8, -5, -5, 0, 7, 10, 12] },
  { key: 'dance', name: 'Dance', eq: [12, 22, 15, 0, 5, 10, 16, 15, 12, 0] },
  { key: 'deep', name: 'Deep', eq: [15, 12, 5, 3, 10, 8, 5, -6, -12, -15] },
  { key: 'electronic', name: 'Electronic', eq: [14, 13, 4, 0, -6, 6, 3, 4, 13, 15] },
  { key: 'hiphop', name: 'Hip Hop', eq: [16, 14, 4, 10, -4, -3, 4, -2, 6, 10] },
  { key: 'jazz', name: 'Jazz', eq: [13, 10, 4, 6, -5, -5, 0, 4, 10, 13] },
  { key: 'latin', name: 'Latin', eq: [9, 5, 0, 0, -5, -5, -5, 0, 10, 15] },
  { key: 'loudness', name: 'Loudness', eq: [20, 14, 0, 0, -6, 0, -2, -18, 16, 3] },
  { key: 'lounge', name: 'Lounge', eq: [-10, -5, -2, 4, 13, 4, 0, -5, 6, 3] },
  { key: 'piano', name: 'Piano', eq: [10, 6, 0, 9, 10, 5, 11, 15, 10, 11] },
  { key: 'pop', name: 'Pop', eq: [-5, -4, 0, 6, 15, 13, 6, 0, -3, -5] },
  { key: 'rnb', name: 'Rnb', eq: [9, 23, 19, 4, -8, -5, 8, 9, 10, 12] },
  { key: 'rock', name: 'Rock', eq: [16, 13, 10, 4, -1, -2, 1, 8, 11, 15] },
  { key: 'smallSpeakers', name: 'Small Speakers', eq: [18, 14, 13, 8, 4, 0, -4, -9, -11, -14] },
  { key: 'spokenWord', name: 'Spoken Word', eq: [-7, -1, 0, 2, 12, 15, 16, 14, 8, 0] },
  { key: 'trebleBooster', name: 'Treble Booster', eq: [0, 0, 0, 0, 0, 3, 8, 12, 14, 17] },
  { key: 'trebleReducer', name: 'Treble Reducer', eq: [0, 0, 0, 0, 0, -3, -8, -12, -14, -17] },
  { key: 'vocalBooster', name: 'Vocal Booster', eq: [-5, -10, -10, 4, 12, 12, 10, 5, 0, -5] },
];

const initialState = {
  eq: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  volume: 2,
  presets: systemPresets,
  selectedPreset: 'default',
  hasManualChanges: false,
  balance: 0,
  isMono: false,
  isInvert: false,
};

const equalizerSlice = createSlice({
  name: 'equalizer',
  initialState,
  reducers: {
    setEq: (state, action) => {
      state.eq = action.payload;
    },
    updateEqValue: (state, action) => {
      const { index, value } = action.payload;
      state.eq[index] = value;
    },
    setVolume: (state, action) => {
      state.volume = action.payload;
    },
    setBalance: (state, action) => {
      state.balance = action.payload;
    },
    setMono: (state, action) => {
      state.isMono = action.payload;
    },
    setInvert: (state, action) => {
      state.isInvert = action.payload;
    },
    setPresets: (state, action) => {
      state.presets = action.payload;
    },
    setSelectedPreset: (state, action) => {
      state.selectedPreset = action.payload;
    },
    loadPreset: (state, action) => {
      const presetKey = action.payload;
      const preset = state.presets.find((p) => p.key === presetKey);
      console.log('[equalizerSlice] loadPreset:', {
        presetKey,
        presetFound: !!preset,
        hasEq: !!(preset && preset.eq),
        eqLength: preset?.eq?.length,
        currentEqLength: state.eq?.length,
      });

      if (preset && preset.eq) {
        const newEq = [...preset.eq];
        console.log('[equalizerSlice] Loading preset eq:', {
          presetKey,
          oldEq: state.eq,
          newEq: newEq,
        });
        state.eq = newEq;
        state.selectedPreset = presetKey;
        state.hasManualChanges = false;
        console.log('[equalizerSlice] Preset loaded successfully, new eq:', state.eq);
      } else {
        console.warn('[equalizerSlice] Cannot load preset:', {
          presetKey,
          presetFound: !!preset,
          hasEq: !!(preset && preset.eq),
        });
      }
    },
    setHasManualChanges: (state, action) => {
      state.hasManualChanges = action.payload;
    },
    resetEqualizer: (state) => {
      const { eq, balance, isMono, isInvert, selectedPreset, hasManualChanges, volume } =
        initialState;
      state.eq = eq;
      state.hasManualChanges = hasManualChanges;
      state.balance = balance;
      state.isMono = isMono;
      state.isInvert = isInvert;
      state.selectedPreset = selectedPreset;
      state.volume = volume;
    },
    addPreset: (state, action) => {
      state.presets.push(action.payload);
    },
    updatePreset: (state, action) => {
      const { key, eq, name } = action.payload;
      const preset = state.presets.find((p) => p.key === key);
      if (preset) {
        if (eq !== undefined) preset.eq = eq;
        if (name !== undefined) preset.name = name;
      }
    },
    deletePreset: (state, action) => {
      const key = action.payload;
      state.presets = state.presets.filter((p) => p.key !== key);
      if (state.selectedPreset === key) {
        state.selectedPreset = 'default';
        const defaultPreset = state.presets.find((p) => p.key === 'default');
        if (defaultPreset) {
          state.eq = [...defaultPreset.eq];
        }
      }
    },
    initializeFromStorage: (state, action) => {
      const { eq, volume, selectedPreset, customPresets, balance, isMono, isInvert } =
        action.payload;

      console.log({
        payload: action.payload,
      });
      if (eq) state.eq = eq;
      if (volume !== undefined) state.volume = volume;
      if (balance !== undefined) state.balance = balance;
      if (isMono !== undefined) state.isMono = isMono;
      if (isInvert !== undefined) state.isInvert = isInvert;
      if (selectedPreset) state.selectedPreset = selectedPreset;

      // Merge system presets with custom presets
      if (customPresets && Array.isArray(customPresets)) {
        state.presets = [...systemPresets, ...customPresets];
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadInitialData.fulfilled, (state, action) => {
      const { prefs } = action.payload;
      const { selectedPreset, eq, volume, customPresets, balance, isMono, isInvert } = prefs || {};

      // Validate and set eq (must be array with 10 numbers)
      if (eq && Array.isArray(eq) && eq.length === 10) {
        const isValidEq = eq.every(
          (val) => typeof val === 'number' && !isNaN(val) && val >= -40 && val <= 40
        );
        if (isValidEq) {
          state.eq = eq;
        } else {
          console.warn(
            'Invalid eq values, using defaults. Values must be numbers between -40 and 40'
          );
        }
      } else if (eq) {
        console.warn('Invalid eq format, expected array of 10 numbers, using defaults');
      }

      if (balance !== undefined && balance !== null) {
        const balanceNum = typeof balance === 'number' ? balance : parseFloat(balance);
        state.balance = balanceNum;
      }

      if (isMono !== undefined && isMono !== null && typeof isMono === 'boolean') {
        state.isMono = isMono;
      }

      if (isInvert !== undefined && isInvert !== null && typeof isInvert === 'boolean') {
        state.isInvert = isInvert;
      }

      // Validate and set volume (must be number between 0 and 4)
      if (volume !== undefined && volume !== null) {
        const volumeNum = typeof volume === 'number' ? volume : parseFloat(volume);
        if (!isNaN(volumeNum) && volumeNum >= 0 && volumeNum <= 4) {
          state.volume = volumeNum;
        } else {
          logger.warn(
            `Invalid volume value: ${volume}, using default (5). Volume must be between 0 and 4`,
            {
              receivedValue: volume,
              receivedType: typeof volume,
            }
          );
        }
      }

      // Validate and set selectedPreset
      const presetKey = selectedPreset || 'default';
      if (typeof presetKey === 'string' && presetKey.trim().length > 0) {
        state.selectedPreset = presetKey;
      } else {
        logger.warn(`Invalid selectedPreset: ${selectedPreset}, using default`, {
          receivedValue: selectedPreset,
          receivedType: typeof selectedPreset,
        });
        state.selectedPreset = 'default';
      }

      // Validate and merge custom presets
      if (customPresets) {
        if (Array.isArray(customPresets)) {
          const validPresets = customPresets.filter(
            (preset) =>
              preset &&
              typeof preset === 'object' &&
              typeof preset.key === 'string' &&
              typeof preset.name === 'string' &&
              Array.isArray(preset.eq) &&
              preset.eq.length === 10
          );
          if (validPresets.length > 0) {
            state.presets = [...systemPresets, ...validPresets];
          } else if (customPresets.length > 0) {
            logger.warn('All custom presets are invalid, using system presets only', {
              totalPresets: customPresets.length,
              validPresets: 0,
            });
          }
        } else {
          logger.warn('customPresets is not an array, using system presets only', {
            receivedType: typeof customPresets,
            isArray: Array.isArray(customPresets),
          });
        }
      }
    });
    builder.addCase(loadInitialData.rejected, (state, action) => {
      // Handle error - keep default values from initialState
      logger.error('Failed to load equalizer data, using defaults', action.error, {
        slice: 'equalizer',
        actionType: action.type,
      });
    });
  },
});

export const {
  setEq,
  updateEqValue,
  setVolume,
  setBalance,
  setMono,
  setInvert,
  setPresets,
  setSelectedPreset,
  loadPreset,
  setHasManualChanges,
  resetEqualizer,
  addPreset,
  updatePreset,
  deletePreset,
  initializeFromStorage,
} = equalizerSlice.actions;

export default equalizerSlice.reducer;
