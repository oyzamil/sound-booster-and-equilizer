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
});
