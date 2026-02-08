import { createSlice } from '@reduxjs/toolkit';
import logger from '../../utils/logger';
import { loadInitialData, toggleEnable } from '../thunks/audioThunks';

const initialState = {
  isLoaded: false,
  isLoading: false,
  tab: {},
  isEnable: false,
  current: 'equalizer',
  tabs: [{ name: 'equalizer', value: 'equalizer', translate: 'Equalizer' }],
  countClick: 0,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setIsLoaded: (state, action) => {
      state.isLoaded = action.payload;
    },
    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setTab: (state, action) => {
      state.tab = action.payload;
    },
    setIsEnable: (state, action) => {
      state.isEnable = action.payload;
    },
    setCurrent: (state, action) => {
      state.current = action.payload;
    },
    incrementCountClick: (state) => {
      if (state.countClick > 100) {
        state.countClick = 0;
      } else {
        state.countClick += 1;
      }
    },
    resetCountClick: (state) => {
      state.countClick = 0;
    },
    initializeFromStorage: (state, action) => {
      const { tab, currentTabId, tabId } = action.payload;
      if (tab) state.tab = tab;
      if (currentTabId !== undefined && tabId !== undefined) {
        state.isEnable = currentTabId === tabId;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadInitialData.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(loadInitialData.fulfilled, (state, action) => {
      const { tab: tabData, prefs } = action.payload;
      const { tab: storedTab, currentTabId } = prefs || {};

      // Validate and set tab (must be object)
      const tab = storedTab || tabData || {};
      if (tab && typeof tab === 'object' && !Array.isArray(tab)) {
        // Validate tab has at least id or url property
        if (tab.id !== undefined || tab.url !== undefined || tab.title !== undefined) {
          state.tab = tab;
        } else {
          logger.warn(
            'Invalid tab object, missing required properties (id, url, or title), using default',
            {
              hasId: tab.id !== undefined,
              hasUrl: tab.url !== undefined,
              hasTitle: tab.title !== undefined,
            }
          );
          state.tab = {};
        }
      } else if (tab) {
        logger.warn('Invalid tab format, expected object, using default', {
          receivedType: typeof tab,
          isArray: Array.isArray(tab),
        });
        state.tab = {};
      }

      // Validate and set isEnable
      if (currentTabId !== undefined && tabData?.id !== undefined) {
        if (typeof currentTabId === 'number' && typeof tabData.id === 'number') {
          state.isEnable = currentTabId === tabData.id;
        } else {
          logger.warn('Invalid currentTabId or tabData.id type, expected numbers', {
            currentTabIdType: typeof currentTabId,
            tabDataIdType: typeof tabData?.id,
          });
        }
      }

      // Mark as loaded
      state.isLoaded = true;
      state.isLoading = false;
    });
    builder.addCase(loadInitialData.rejected, (state, action) => {
      // Handle error - set default values and mark as loaded to prevent infinite loading
      logger.error('Failed to load initial data, using defaults', action.error, {
        slice: 'ui',
        actionType: action.type,
      });
      state.isLoaded = true;
      state.isLoading = false;
      // Keep default values from initialState
    });
    builder.addCase(toggleEnable.fulfilled, (state, action) => {
      // Update isEnable state when toggle is successful
      if (action.payload && action.payload.newValue !== undefined) {
        state.isEnable = action.payload.newValue;
      }
    });
    builder.addCase(toggleEnable.rejected, (state, action) => {
      // Log error but don't change state (keep current isEnable)
      logger.error('Failed to toggle enable state', action.error, {
        slice: 'ui',
        actionType: action.type,
      });
    });
  },
});

export const {
  setIsLoaded,
  setIsLoading,
  setIsEnable,
  incrementCountClick,
  initializeFromStorage,
} = uiSlice.actions;

export default uiSlice.reducer;
