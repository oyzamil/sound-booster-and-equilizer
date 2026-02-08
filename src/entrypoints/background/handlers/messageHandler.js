/**
 * Message handler for background script
 */
import { disableEqualizer, enableEqualizer, getCurrentTab } from '../services/tabService.js';
import createOffscreenDocument from '../utils/createOffscreenDocument.js';

// Audio processing message types
const AUDIO_MESSAGE_TYPES = [
  'change_equalizer',
  'change_volume',
  'closeAudio',
  'change_chorus',
  'change_convolver',
  'change_compressor',
  'change_pitch',
  'connect_compressor',
  'disconnect_compressor',
  'change_balance',
  'change_mono',
  'change_invert',
  'reset_equalizer',
];

/**
 * Handle changeStatus message (enable/disable equalizer)
 */
export const handleChangeStatus = (message, sendResponse) => {
  // Execute async operation but ensure sendResponse is called
  // Using IIFE to handle async operations properly
  (async () => {
    try {
      if (message.value === true) {
        // Enable equalizer
        const currentTab = await getCurrentTab(message.tab);
        const result = await enableEqualizer(currentTab);
        // Check if sendResponse is still valid before calling
        if (sendResponse) {
          sendResponse(result);
        }
      } else {
        // Disable equalizer
        const result = await disableEqualizer();
        // Check if sendResponse is still valid before calling
        if (sendResponse) {
          sendResponse(result);
        }
      }
    } catch (error) {
      console.error('Error handling changeStatus:', error);
      // Check if sendResponse is still valid before calling
      if (sendResponse) {
        sendResponse({
          status: false,
          message: error.message.includes('tab') ? 'TAB_NOT_FOUND' : 'CAPTURE_ERROR',
          error: error.message,
        });
      }
    }
  })();

  // Return true to keep the message channel open for async response
  return true;
};

/**
 * Forward audio processing messages to offscreen
 */
export const handleAudioMessage = (message, sendResponse) => {
  // Execute async operation but ensure sendResponse is called
  (async () => {
    try {
      const storageData = await browser.storage.local.get(['currentTabId']);
      const currentTabId = storageData.currentTabId;

      if (!currentTabId) {
        if (sendResponse) {
          sendResponse({
            status: false,
            message: 'NO_ACTIVE_TAB',
          });
        }
        return;
      }

      // Ensure offscreen document exists
      await createOffscreenDocument();

      // Convert message format for offscreen
      const offscreenMessage = {
        target: 'offscreen',
        tabId: currentTabId,
        name: message.type,
        type: message.type,
        value: message.value,
      };

      // Send message to offscreen
      browser.runtime.sendMessage(offscreenMessage, (response) => {
        if (browser.runtime.lastError) {
          console.error(
            `Error forwarding ${message.type} to offscreen:`,
            browser.runtime.lastError
          );
          if (sendResponse) {
            sendResponse({
              status: false,
              error: browser.runtime.lastError.message,
            });
          }
        } else {
          if (sendResponse) {
            sendResponse(response || { status: true });
          }
        }
      });
    } catch (error) {
      console.error(`Error handling audio message ${message.type}:`, error);
      if (sendResponse) {
        sendResponse({
          status: false,
          error: error.message,
        });
      }
    }
  })();

  // Return true to keep the message channel open for async response
  return true;
};

/**
 * Main message handler
 */
export const handleMessage = (message, sender, sendResponse) => {
  // Handle changeStatus
  if (message.type === 'changeStatus') {
    handleChangeStatus(message, sendResponse);
    return true; // Keep channel open for async response
  }

  // Handle audio processing messages
  if (AUDIO_MESSAGE_TYPES.includes(message.type)) {
    handleAudioMessage(message, sendResponse);
    return true; // Keep channel open for async response
  }

  // Unknown message type
  return false;
};
