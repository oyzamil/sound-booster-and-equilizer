interface Message {
  target: string;
  type: string;
  tabId?: number;
  data?: AudioSettings;
  index?: number | boolean;
  streamId?: string | boolean;
  state?: Browser.windows.WindowState;
}

interface AudioSettings {
  compressor: CompressorSettings;
  eq: EqualizerSettings;
  mono: boolean;
  invert: boolean;
  pan: number;
  volume: number;
}

interface CompressorSettings {
  threshold: number;
  attack: number;
  release: number;
  ratio: number;
  knee: number;
}

interface EqualizerSettings {
  twenty: number;
  fifty: number;
  oneHundred: number;
  twoHundred: number;
  fiveHundred: number;
  oneThousand: number;
  twoThousand: number;
  fiveThousand: number;
  tenThousand: number;
  twentyThousand: number;
}

interface StorageData {
  saved?: boolean;
  settings?: AudioSettings;
}

export default defineBackground(() => {
  try {
    browser.runtime.onMessage.addListener(
      (
        message: Message,
        sender: Browser.runtime.MessageSender,
        sendResponse: (response?: any) => void
      ) => {
        const { target, type, tabId, data } = message;

        if (target !== 'worker') {
          return false;
        }

        switch (type) {
          case 'popupReady':
            if (tabId) {
              onPopupReady(tabId).catch((error) => console.error('popupReady error:', error));
            }
            return false;

          case 'getSavedSettings':
            getSavedSettings()
              .then((response) => sendResponse(response))
              .catch((error) => {
                console.error('getSavedSettings error:', error);
                sendResponse({});
              });
            return true;

          case 'getDefaultSettings':
            sendResponse(getDefaultSettings());
            return false;

          case 'deleteSavedSettings':
            setDefaultSettings()
              .then(() => setSavedState(false))
              .catch((error) => console.error('deleteSavedSettings error:', error));
            return false;

          case 'saveToStorage':
            if (data) {
              saveSettings(data)
                .then(() => setSavedState(true))
                .catch((error) => console.error('saveToStorage error:', error));
            }
            return false;

          default:
            console.error('Unknown message type:', type);
            return false;
        }
      }
    );

    // Tab removed listener
    browser.tabs.onRemoved.addListener(async (tabId: number) => {
      try {
        await browser.runtime.sendMessage({
          target: 'offscreen',
          type: 'tabRemoved',
          tabId,
        });
      } catch (error) {
        // Offscreen might not exist, that's okay
        console.warn('Tab removed message failed (expected if offscreen closed)');
      }
    });

    // Tab capture listener
    browser.tabCapture.onStatusChanged.addListener(
      async (event: Browser.tabCapture.CaptureInfo) => {
        const { status, fullscreen, tabId } = event;

        if (status !== 'active' || !tabId) {
          return;
        }

        try {
          const index = await getCapturedTabIndex(tabId);
          const isCaptured = index > -1;

          if (isCaptured) {
            await toggleFullscreen({ fullscreen: fullscreen ?? false, tabId });
          }
        } catch (error) {
          console.error('Tab capture status error:', error);
        }
      }
    );

    // Installation listener
    browser.runtime.onInstalled.addListener(async ({ reason, previousVersion }) => {
      if (reason === 'chrome_update') {
        return;
      }

      await verifyOffscreenDoc();

      if (reason === 'update') {
        await onUpdated(previousVersion);
      } else if (reason === 'install') {
        await onInstalled();
      }
    });
  } catch (error) {
    console.error('Service Worker Error:', error);
  }
});

// Helper functions
async function onPopupReady(tabId: number): Promise<void> {
  await verifyOffscreenDoc();

  const index = await getCapturedTabIndex(tabId);
  const tabIsCaptured = index !== -1;

  browser.runtime
    .sendMessage({
      target: 'offscreen',
      type: tabIsCaptured ? 'loadCapturedTab' : 'captureTab',
      streamId: !tabIsCaptured ? await getStreamId(tabId) : undefined,
      tabId,
    })
    .catch((error) => console.error('onPopupReady message error:', error));
}

async function setSavedState(isSaved: boolean): Promise<void> {
  await browser.storage.sync.set({ saved: isSaved });
}

async function getSavedSettings(): Promise<StorageData> {
  return await browser.storage.sync.get();
}

async function saveSettings(settingsObject: AudioSettings): Promise<void> {
  await browser.storage.sync.set({ settings: settingsObject });
}

function getDefaultSettings(): AudioSettings {
  return {
    compressor: {
      threshold: 0,
      attack: 0,
      release: 0.2,
      ratio: 10,
      knee: 4,
    },
    eq: {
      twenty: 0,
      fifty: 0,
      oneHundred: 0,
      twoHundred: 0,
      fiveHundred: 0,
      oneThousand: 0,
      twoThousand: 0,
      fiveThousand: 0,
      tenThousand: 0,
      twentyThousand: 0,
    },
    mono: false,
    invert: false,
    pan: 0,
    volume: 1,
  };
}

async function setDefaultSettings(): Promise<void> {
  await browser.storage.sync.set({ settings: getDefaultSettings() });
}

async function getStreamId(tabId: number): Promise<string | undefined> {
  try {
    const streamId = await browser.tabCapture.getMediaStreamId({
      targetTabId: tabId,
    });

    if (streamId && typeof streamId === 'string') {
      return streamId;
    }

    console.error('Invalid streamId');
    return undefined;
  } catch (error) {
    console.error('Error getting stream ID:', error);
    return undefined;
  }
}

async function verifyOffscreenDoc(): Promise<void> {
  try {
    const contexts = await browser.runtime.getContexts({});
    const offscreenDocument = contexts.find((c) => c.contextType === 'OFFSCREEN_DOCUMENT');

    if (!offscreenDocument) {
      await browser.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: [browser.offscreen.Reason.USER_MEDIA],
        justification: 'Recording from browser.tabCapture API',
      });
    }
  } catch (error) {
    console.error('Error verifying offscreen document:', error);
  }
}

async function enterFullscreen(): Promise<void> {
  try {
    const currentWindow = await browser.windows.getCurrent();
    if (currentWindow.id) {
      await browser.windows.update(currentWindow.id, { state: 'fullscreen' });
    }
  } catch (error) {
    console.error('Error entering fullscreen:', error);
  }
}

async function exitFullscreen(state: Browser.windows.WindowState): Promise<void> {
  try {
    const currentWindow = await browser.windows.getCurrent();
    if (currentWindow.id) {
      await browser.windows.update(currentWindow.id, { state });
    }
  } catch (error) {
    console.error('Error exiting fullscreen:', error);
  }
}

async function getSavedWindowState(
  state: Browser.windows.WindowState,
  tabId: number
): Promise<Browser.windows.WindowState> {
  try {
    const response = await browser.runtime.sendMessage({
      target: 'offscreen',
      type: 'getSavedWindowState',
      state,
      tabId,
    });
    return response?.state || state;
  } catch (error) {
    console.error('Error getting saved window state:', error);
    return state;
  }
}

async function saveWindowState(state: Browser.windows.WindowState, tabId: number): Promise<void> {
  try {
    await browser.runtime.sendMessage({
      target: 'offscreen',
      type: 'saveWindowState',
      state,
      tabId,
    });
  } catch (error) {
    console.error('Error saving window state:', error);
  }
}

async function toggleFullscreen({
  fullscreen,
  tabId,
}: {
  fullscreen: boolean;
  tabId: number;
}): Promise<void> {
  try {
    const currentWindow = await browser.windows.getCurrent();
    const windowState = currentWindow.state as Browser.windows.WindowState;

    if (!windowState) return;

    if (fullscreen) {
      await saveWindowState(windowState, tabId);
      await enterFullscreen();
    } else {
      const savedState = await getSavedWindowState(windowState, tabId);
      await exitFullscreen(savedState);
    }
  } catch (error) {
    console.error('Error toggling fullscreen:', error);
  }
}

async function onInstalled(): Promise<void> {
  await initializeStorage();
}

async function onUpdated(previousVersion?: string): Promise<void> {
  await browser.storage.sync.clear();
  await initializeStorage();
}

async function initializeStorage(): Promise<void> {
  await setDefaultSettings();
  await setSavedState(false);
}

async function getCapturedTabIndex(tabId: number): Promise<number> {
  try {
    return await browser.runtime.sendMessage({
      target: 'offscreen',
      type: 'getIndex',
      tabId,
    });
  } catch (error) {
    console.error('Error getting captured tab index:', error);
    return -1;
  }
}
