import { configureStore } from '@reduxjs/toolkit';
import logger from '../utils/logger';
import audioSyncMiddleware from './middleware/audioSyncMiddleware';
import chromeStorageMiddleware from './middleware/chromeStorageMiddleware';
import iconUpdateMiddleware from './middleware/iconUpdateMiddleware';
import effectsReducer from './slices/effectsSlice';
import equalizerReducer from './slices/equalizerSlice';
import uiReducer from './slices/uiSlice';
import { loadInitialData } from './thunks/audioThunks';

export const store = configureStore({
  reducer: {
    equalizer: equalizerReducer,
    effects: effectsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['ui/setTab'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.tab'],
        // Ignore these paths in the state
        ignoredPaths: ['ui.tab'],
      },
    }).concat(chromeStorageMiddleware, audioSyncMiddleware, iconUpdateMiddleware),
});

// Load initial data from Chrome storage immediately after store creation
// This happens before React components mount, ensuring data is available when needed
store
  .dispatch(loadInitialData())
  .unwrap()
  .catch((error) => {
    logger.error('Failed to load initial data during store initialization', error, {
      location: 'store/index.js',
    });
  });
