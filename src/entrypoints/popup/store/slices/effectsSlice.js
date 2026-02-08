import { createSlice } from '@reduxjs/toolkit';
import logger from '../../utils/logger';
import { loadInitialData } from '../thunks/audioThunks';

const initialState = {
  pitch: {},
  convolver: {
    highCut: 22050,
    lowCut: 20,
    dryLevel: 1,
    wetLevel: 0,
    level: 1,
    bypass: false,
  },
  compressor: {
    threshold: 0,
    release: 0.2,
    makeupGain: 1,
    attack: 0,
    ratio: 4,
    knee: 10,
    bypass: false,
    automakeup: false,
  },
  chorus: {
    depth: 0.7,
    rate: 0,
    feedback: 0,
    delay: 0,
    bypass: false,
  },
  advanced: {},
  isChorus: false,
  isConvolver: false,
  isCompressor: false,
  isMono: false,
  isInvert: false,
  balance: 0,
};

const effectsSlice = createSlice({
  name: 'effects',
  initialState,
  reducers: {
    setPitch: (state, action) => {
      state.pitch = action.payload;
    },
    setConvolver: (state, action) => {
      state.convolver = action.payload;
    },
    updateConvolver: (state, action) => {
      const { name, value } = action.payload;
      state.convolver[name] = parseFloat(value) || 0;
    },
    setCompressor: (state, action) => {
      state.compressor = action.payload;
    },
    updateCompressor: (state, action) => {
      const { name, value } = action.payload;
      state.compressor[name] = value;
    },
    setChorus: (state, action) => {
      state.chorus = action.payload;
    },
    updateChorus: (state, action) => {
      const { name, value } = action.payload;
      state.chorus[name] = value;
    },
    setAdvanced: (state, action) => {
      state.advanced = action.payload;
    },
    setIsChorus: (state, action) => {
      state.isChorus = action.payload;
    },
    setIsConvolver: (state, action) => {
      state.isConvolver = action.payload;
    },
    setIsCompressor: (state, action) => {
      state.isCompressor = action.payload;
    },
    resetCompressor: (state) => {
      state.compressor = {
        threshold: 0,
        release: 0.2,
        makeupGain: 1,
        attack: 0,
        ratio: 4,
        knee: 10,
        bypass: false,
        automakeup: false,
      };
    },
    resetConvolver: (state) => {
      state.convolver = {
        highCut: 22050,
        lowCut: 20,
        dryLevel: 1,
        wetLevel: 0,
        level: 1,
        bypass: false,
      };
    },
    resetChorus: (state) => {
      state.chorus = {
        depth: 0.7,
        rate: 0,
        feedback: 0,
        delay: 0,
        bypass: false,
      };
    },
    resetPitch: (state) => {
      state.pitch = { feedback: 0.4 };
    },
    initializeFromStorage: (state, action) => {
      const { pitch, convolver, chorus, advanced } = action.payload;
      if (pitch) state.pitch = pitch;
      if (convolver && Object.keys(convolver).length > 0) {
        state.convolver = { ...state.convolver, ...convolver };
      }
      if (chorus && Object.keys(chorus).length > 0) {
        state.chorus = { ...state.chorus, ...chorus };
      }
      if (advanced) state.advanced = advanced;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadInitialData.fulfilled, (state, action) => {
      const { prefs } = action.payload;
      const { pitch, convolver, chorus, advanced } = prefs || {};

      // Validate and set pitch (must be object)
      if (pitch) {
        if (typeof pitch === 'object' && pitch !== null && !Array.isArray(pitch)) {
          state.pitch = pitch;
        } else {
          logger.warn('Invalid pitch format, expected object, using default', {
            receivedType: typeof pitch,
            isArray: Array.isArray(pitch),
          });
        }
      }

      // Validate and merge convolver (must be object with valid properties)
      if (convolver) {
        if (typeof convolver === 'object' && convolver !== null && !Array.isArray(convolver)) {
          const validConvolver = { ...state.convolver };
          const defaultConvolver = initialState.convolver;

          // Validate each property
          Object.keys(convolver).forEach((key) => {
            if (key in defaultConvolver) {
              const value = convolver[key];
              const defaultValue = defaultConvolver[key];

              if (typeof value === typeof defaultValue) {
                if (typeof value === 'boolean') {
                  validConvolver[key] = value;
                } else if (typeof value === 'number' && !isNaN(value)) {
                  validConvolver[key] = value;
                } else {
                  logger.warn(`Invalid convolver.${key} value: ${value}, using default`, {
                    property: key,
                    receivedValue: value,
                    receivedType: typeof value,
                  });
                }
              } else {
                logger.warn(
                  `Invalid type for convolver.${key}, expected ${typeof defaultValue}, using default`,
                  {
                    property: key,
                    receivedType: typeof value,
                    expectedType: typeof defaultValue,
                  }
                );
              }
            }
          });
          state.convolver = validConvolver;
        } else {
          logger.warn('Invalid convolver format, expected object, using defaults', {
            receivedType: typeof convolver,
            isArray: Array.isArray(convolver),
          });
        }
      }

      // Validate and merge chorus (must be object with valid properties)
      if (chorus) {
        if (typeof chorus === 'object' && chorus !== null && !Array.isArray(chorus)) {
          const validChorus = { ...state.chorus };
          const defaultChorus = initialState.chorus;

          // Validate each property
          Object.keys(chorus).forEach((key) => {
            if (key in defaultChorus) {
              const value = chorus[key];
              const defaultValue = defaultChorus[key];

              if (typeof value === typeof defaultValue) {
                if (typeof value === 'boolean') {
                  validChorus[key] = value;
                } else if (typeof value === 'number' && !isNaN(value)) {
                  validChorus[key] = value;
                } else {
                  logger.warn(`Invalid chorus.${key} value: ${value}, using default`, {
                    property: key,
                    receivedValue: value,
                    receivedType: typeof value,
                  });
                }
              } else {
                logger.warn(
                  `Invalid type for chorus.${key}, expected ${typeof defaultValue}, using default`,
                  {
                    property: key,
                    receivedType: typeof value,
                    expectedType: typeof defaultValue,
                  }
                );
              }
            }
          });
          state.chorus = validChorus;
        } else {
          logger.warn('Invalid chorus format, expected object, using defaults', {
            receivedType: typeof chorus,
            isArray: Array.isArray(chorus),
          });
        }
      }

      // Validate and set advanced (must be object)
      if (advanced) {
        if (typeof advanced === 'object' && advanced !== null && !Array.isArray(advanced)) {
          state.advanced = advanced;
        } else {
          logger.warn('Invalid advanced format, expected object, using default', {
            receivedType: typeof advanced,
            isArray: Array.isArray(advanced),
          });
        }
      }
    });
    builder.addCase(loadInitialData.rejected, (state, action) => {
      // Handle error - keep default values from initialState
      logger.error('Failed to load effects data, using defaults', action.error, {
        slice: 'effects',
        actionType: action.type,
      });
    });
  },
});

export const {
  setPitch,
  setConvolver,
  updateConvolver,
  setCompressor,
  updateCompressor,
  setChorus,
  updateChorus,
  setAdvanced,
  setIsChorus,
  setIsConvolver,
  setIsCompressor,
  resetCompressor,
  resetConvolver,
  resetChorus,
  resetPitch,
  initializeFromStorage,
} = effectsSlice.actions;

export default effectsSlice.reducer;
