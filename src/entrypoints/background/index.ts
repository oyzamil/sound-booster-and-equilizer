export default defineBackground(() => {
  console.log('Audio Equalizer background service started');

  let offscreenDocumentCreated = false;

  async function createOffscreenDocument() {
    if (offscreenDocumentCreated) return;

    try {
      // Check if offscreen document already exists
      const existingContexts = await browser.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT' as any],
      });

      if (existingContexts.length > 0) {
        offscreenDocumentCreated = true;
        return;
      }

      await browser.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['AUDIO_PLAYBACK' as any],
        justification: 'Audio processing and equalization',
      });

      offscreenDocumentCreated = true;
      console.log('Offscreen document created');
    } catch (error) {
      console.error('Failed to create offscreen document:', error);
    }
  }

  // Handle settings updates
  onMessage('updateSettings', async ({ data }) => {
    await chromeStorage.setSettings(data);

    // Forward to content scripts in all tabs
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        try {
          await browser.tabs.sendMessage(tab.id, {
            type: 'SETTINGS_UPDATE',
            settings: data,
          });
        } catch (error) {
          // Tab might not have content script
        }
      }
    }
  });

  // Handle get settings requests
  onMessage('getSettings', async () => {
    return await chromeStorage.getSettings();
  });

  // Handle apply to specific tab
  onMessage('applyToTab', async ({ data }) => {
    const { tabId, settings } = data;
    try {
      await browser.tabs.sendMessage(tabId, {
        type: 'SETTINGS_UPDATE',
        settings,
      });
    } catch (error) {
      console.error('Failed to apply settings to tab:', error);
    }
  });

  // Initialize offscreen document on install
  browser.runtime.onInstalled.addListener(() => {
    createOffscreenDocument();
  });

  // Listen for tab updates
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
      await createOffscreenDocument();
    }
  });

  // Storage change listener
  browser.storage.onChanged.addListener((changes, areaName) => {
    console.log(changes);
    if (areaName === 'local' && changes.audioSettings) {
      console.log('Settings changed:', changes.audioSettings.newValue);
    }
  });
});
