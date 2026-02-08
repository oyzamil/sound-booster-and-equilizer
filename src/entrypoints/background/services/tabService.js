/**
 * Service for managing tab operations
 */
import { captureTab, disposeTab } from '../utils/captureTab.js';

/**
 * Get current active tab
 */
export const getCurrentTab = async (messageTab = null) => {
  let currentTab = null;

  // Try to get tab from message first (if valid)
  if (messageTab && messageTab.id && typeof messageTab.id === 'number') {
    try {
      currentTab = await browser.tabs.get(messageTab.id);
      // Verify tab still exists and is valid
      if (currentTab && currentTab.id) {
        return currentTab;
      }
    } catch (error) {
      console.warn('Error getting tab from message:', error);
      // Tab might have been closed, continue to query for active tab
    }
  }

  // If tab not found in message or invalid, try to get from storage
  if (!currentTab) {
    try {
      const storageData = await browser.storage.local.get(['tab']);
      const storedTab = storageData.tab;

      // Try to use stored tab if it has valid id
      if (storedTab && storedTab.id && typeof storedTab.id === 'number') {
        try {
          currentTab = await browser.tabs.get(storedTab.id);
          if (currentTab && currentTab.id) {
            return currentTab;
          }
        } catch (error) {
          console.warn('Stored tab no longer exists:', error);
          // Continue to query for active tab
        }
      }
    } catch (error) {
      console.warn('Error getting stored tab:', error);
    }
  }

  // If still no tab, query for active tab
  if (!currentTab) {
    try {
      const tabs = await browser.tabs.query({ active: true, lastFocusedWindow: true });
      if (tabs && tabs.length > 0) {
        currentTab = tabs[0];
      }
    } catch (error) {
      console.error('Error querying active tab:', error);
      throw new Error(`Failed to get active tab: ${error.message}`);
    }
  }

  if (!currentTab || !currentTab.id) {
    throw new Error('No active tab found');
  }

  return currentTab;
};

/**
 * Enable equalizer for a tab
 */
export const enableEqualizer = async (tab) => {
  if (!tab || !tab.id) {
    throw new Error('Invalid tab');
  }

  // Allow enabling even if not audible (user might want to prepare for audio)
  if (!tab.audible) {
    console.warn('Tab is not currently audible, but allowing capture anyway');
  }

  // Get volume from storage or use default
  const storageData = await browser.storage.local.get(['volume']);
  const storedVolume = storageData.volume || 1;

  // Capture tab with error handling
  console.log(`[enableEqualizer] Attempting to capture tab ${tab.id} with volume ${storedVolume}`);
  let captureResult;
  try {
    captureResult = await captureTab(tab.id, storedVolume);
    console.log(`[enableEqualizer] Capture result:`, captureResult);
  } catch (error) {
    console.error(`[enableEqualizer] Capture failed with error:`, error);
    browser.storage.local.set({ currentTabId: null });
    throw new Error(`Failed to capture tab: ${error.message}`);
  }

  // Verify capture was successful
  if (!captureResult || captureResult.status === false) {
    console.error(`[enableEqualizer] Capture result indicates failure:`, captureResult);
    browser.storage.local.set({ currentTabId: null });
    throw new Error(captureResult?.error || 'Failed to capture tab');
  }

  // Save tab info and currentTabId together after successful capture
  browser.storage.local.set({
    currentTabId: tab.id,
    tab: tab,
  });

  return { status: true };
};

/**
 * Disable equalizer for current tab
 */
export const disableEqualizer = async () => {
  const storageData = await browser.storage.local.get(['currentTabId', 'tab']);
  const currentTabId = storageData.currentTabId;
  const storedTab = storageData.tab;

  if (currentTabId) {
    try {
      // Dispose tab first
      disposeTab(currentTabId);

      // Also send closeAudio message to offscreen as backup
      browser.runtime.sendMessage(
        {
          name: 'closeAudio',
          target: 'offscreen',
          tabId: currentTabId,
        },
        (response) => {
          if (browser.runtime.lastError) {
            console.error('Error closing audio:', browser.runtime.lastError);
          }
        }
      );
    } catch (error) {
      console.error('Error disposing tab:', error);
    }
  }

  // Clear currentTabId but keep tab info for potential reuse
  // This allows us to try to use the last known tab when re-enabling
  browser.storage.local.set({
    currentTabId: null,
    // Keep tab info if it exists, so we can try to use it later
    // It will be cleared if tab is closed (handled in handleTabRemoved)
  });

  return { status: true };
};

/**
 * Handle tab removal
 */
export const handleTabRemoved = async (tabId) => {
  const storageData = await browser.storage.local.get(['currentTabId']);
  const currentTabId = storageData.currentTabId;

  if (currentTabId === tabId) {
    disposeTab(tabId);
    browser.storage.local.set({
      tab: {
        id: null,
        title: null,
        icon: null,
      },
      currentTabId: null,
    });
  }
};
