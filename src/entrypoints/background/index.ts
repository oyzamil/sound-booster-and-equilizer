/**
 * Background script - main entry point
 */
import { handleInstall } from './handlers/installHandler.js';
import { handleMessage } from './handlers/messageHandler.js';
import { handleTabRemoved } from './services/tabService.js';

/**
 * Helper function to get parameter from browser.storage.local
 * @param {string} key - Storage key
 * @returns {Promise<any>} - Value from storage or undefined
 */
const getParam = async (key) => {
  try {
    const result = await browser.storage.local.get([key]);
    return result[key];
  } catch (error) {
    console.error(`Error getting param ${key}:`, error);
    return undefined;
  }
};

/**
 * Handle fullscreen changes when tab capture status changes
 * @param {Object} data - Status change data from browser.tabCapture.onStatusChanged
 */
const fullScreenFix = async (data) => {
  try {
    // Check if status is active and tabId exists
    if (data.status !== 'active' || !data.tabId) {
      return;
    }

    // Set fullScreen flag in storage
    try {
      await browser.storage.local.set({ fullScreen: true });
    } catch (error) {
      console.error('Error setting fullScreen flag:', error);
      return;
    }

    // Get current window
    let window;
    try {
      window = await browser.windows.getCurrent();
    } catch (error) {
      console.error('Error getting current window:', error);
      return;
    }

    if (!window || !window.id) {
      console.error('Invalid window object');
      return;
    }

    const windowId = window.id;

    // Check if fullScreen feature is enabled
    const isfullScreen = await getParam('fullScreen');

    // If fullScreen feature is disabled (explicitly false), restore window state
    if (isfullScreen === false) {
      try {
        await browser.windows.update(windowId, { state: window.state });
      } catch (error) {
        console.error('Error restoring window state:', error);
      }
      return;
    }

    // If fullScreen feature is enabled
    if (data.fullscreen === true) {
      // Save current window state before going fullscreen
      try {
        await browser.storage.local.set({ windowState: window.state });
      } catch (error) {
        console.error('Error saving window state:', error);
      }

      // Set window to fullscreen
      try {
        await browser.windows.update(windowId, { state: 'fullscreen' });
      } catch (error) {
        console.error('Error setting window to fullscreen:', error);
      }
    } else {
      // Restore previous window state
      const windowState = await getParam('windowState');
      const stateToRestore = windowState || window.state;

      try {
        await browser.windows.update(windowId, { state: stateToRestore });
      } catch (error) {
        console.error('Error restoring window state:', error);
      }
    }
  } catch (error) {
    console.error('Error in fullScreenFix:', error);
  }
};

export default defineBackground(() => {
  // Handle extension installation/update
  browser.runtime.onInstalled.addListener(handleInstall);

  // Handle messages from popup and other parts of extension
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    return handleMessage(message, sender, sendResponse);
  });

  // Handle tab removal
  browser.tabs.onRemoved.addListener(handleTabRemoved);

  // Handle tab capture status changes for fullscreen management
  browser.tabCapture.onStatusChanged.addListener(fullScreenFix);
});
