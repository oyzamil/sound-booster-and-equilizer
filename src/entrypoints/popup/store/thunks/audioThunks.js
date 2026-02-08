import { createAsyncThunk } from '@reduxjs/toolkit';
import { getCurrentTab } from '../../Services';
import logger from '../../utils/logger';
import { sendMessageToBackground } from '../../utils/messageUtils';

// Thunk for sending messages to background
export const sendMessage = createAsyncThunk(
  'audio/sendMessage',
  async ({ action, data, skipTab = false }, { rejectWithValue }) => {
    try {
      const realTimeActions = [
        'change_equalizer',
        'change_volume',
        'change_chorus',
        'change_convolver',
        'change_compressor',
        'change_pitch',
        'change_balance',
        'change_mono',
        'change_invert',
        'reset_equalizer',
      ];
      const isRealTimeAction = realTimeActions.includes(action);

      let tab = null;
      if (!skipTab && (!isRealTimeAction || action === 'changeStatus')) {
        tab = await getCurrentTab();

        if (!tab || !tab.id) {
          return rejectWithValue({
            status: false,
            message: 'INVALID_TAB',
            error: 'No valid tab found',
          });
        }
      } else {
        tab = { id: null };
      }

      return new Promise((resolve, reject) => {
        try {
          /* eslint-disable no-undef */
          browser.runtime.sendMessage({ type: action, value: data, tab: tab }, (response) => {
            if (browser.runtime.lastError) {
              const error = {
                status: false,
                message: 'MESSAGE_ERROR',
                error: browser.runtime.lastError.message,
              };
              reject(rejectWithValue(error));
            } else {
              resolve(response || { status: false });
            }
          });
        } catch (e) {
          const error = {
            status: false,
            message: 'EXCEPTION',
            error: e.message,
          };
          reject(rejectWithValue(error));
        }
      });
    } catch (e) {
      return rejectWithValue({
        status: false,
        message: 'ERROR',
        error: e.message,
      });
    }
  }
);

// Thunk for loading initial data from Chrome storage
export const loadInitialData = createAsyncThunk(
  'audio/loadInitialData',
  async (_, { rejectWithValue }) => {
    try {
      logger.info('Starting to load initial data from Chrome storage');

      let tab;
      try {
        tab = await getCurrentTab();
        logger.debug('Current tab retrieved', { tabId: tab?.id, tabUrl: tab?.url });
      } catch (tabError) {
        logger.error('Failed to get current tab', tabError, { operation: 'getCurrentTab' });
        // Continue with null tab, will use defaults
        tab = { id: null, url: null };
      }

      return new Promise((resolve, reject) => {
        /* eslint-disable no-undef */
        browser.storage.local.get((prefs) => {
          if (browser.runtime.lastError) {
            const error = {
              error: browser.runtime.lastError.message,
              errorCode: browser.runtime.lastError.message,
            };
            logger.storage('get', 'error', {
              error: browser.runtime.lastError.message,
              tabId: tab?.id,
            });
            reject(rejectWithValue(error));
          } else {
            const prefsData = prefs || {};
            const keysCount = Object.keys(prefsData).length;
            logger.storage('get', 'success', {
              keysCount,
              hasEq: !!prefsData.eq,
              hasVolume: prefsData.volume !== undefined,
              hasPresets: !!prefsData.customPresets,
              tabId: tab?.id,
            });

            resolve({
              tab,
              prefs: prefsData,
            });
          }
        });
      });
    } catch (e) {
      logger.error('Exception in loadInitialData thunk', e, {
        operation: 'loadInitialData',
        errorType: e.constructor?.name,
      });
      return rejectWithValue({
        error: e.message,
        errorType: e.constructor?.name,
      });
    }
  }
);

// Thunk for toggling enable/disable state
export const toggleEnable = createAsyncThunk(
  'audio/toggleEnable',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const currentIsEnable = state.ui.isEnable;
      const newValue = !currentIsEnable;
      const { eq, volume, balance, isMono, isInvert } = state.equalizer;

      logger.info('Toggling enable state', {
        current: currentIsEnable,
        new: newValue,
      });

      // Send changeStatus message to background
      const response = await sendMessageToBackground('changeStatus', newValue, false);

      logger.info('changeStatus', {
        response: response,
      });

      if (response && response.status === true) {
        // If enabling, send current values after a short delay
        if (newValue === true) {
          setTimeout(() => {
            sendMessageToBackground('change_equalizer', eq, true).catch((error) => {
              logger.error('Error sending initial equalizer values after enable', error, {
                action: 'change_equalizer',
                eqLength: eq?.length,
              });
            });
            sendMessageToBackground('change_volume', volume, true).catch((error) => {
              logger.error('Error sending initial volume after enable', error, {
                action: 'change_volume',
                volume,
              });
            });
            sendMessageToBackground('change_balance', balance, true).catch((error) => {
              logger.error('Error sending initial balance after enable', error, {
                action: 'change_balance',
                balance,
              });
            });
            sendMessageToBackground('change_mono', isMono, true).catch((error) => {
              logger.error('Error sending initial isMono after enable', error, {
                action: 'change_mono',
                isMono,
              });
            });
            sendMessageToBackground('change_invert', isInvert, true).catch((error) => {
              logger.error('Error sending initial isInvert after enable', error, {
                action: 'change_invert',
                isInvert,
              });
            });
          }, 400); // Slightly more than delay in captureTab (300ms)
        }

        return { success: true, newValue };
      } else {
        const errorMessage = response?.message || 'UNKNOWN_ERROR';
        const errorDetails = response?.error || '';

        logger.error('Error toggling EQ', null, {
          errorMessage,
          errorDetails,
          currentIsEnable,
        });

        // Provide specific error messages
        if (errorMessage === 'NO_AUDIO') {
          logger.warn('Tab is not currently playing audio');
        } else if (errorMessage === 'CAPTURE_ERROR') {
          logger.error('Failed to capture tab audio', null, { errorDetails });
        } else if (errorMessage === 'TAB_NOT_FOUND') {
          logger.error('Active tab not found');
        } else if (errorMessage === 'INVALID_TAB') {
          logger.error('Invalid tab information');
        }

        return rejectWithValue({
          error: errorMessage,
          details: errorDetails,
        });
      }
    } catch (error) {
      logger.error('Exception toggling EQ', error, {
        operation: 'toggleEnable',
      });
      return rejectWithValue({
        error: error.message || 'UNKNOWN_ERROR',
      });
    }
  }
);
