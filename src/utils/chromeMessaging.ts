export const sendChromeMessage = (message: Message): Promise<any> => {
  return new Promise((resolve, reject) => {
    browser.runtime.sendMessage(message, (response) => {
      if (browser.runtime.lastError) {
        reject(browser.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
};

export const notifyWorkerReady = (tabId: number): void => {
  sendChromeMessage({
    target: 'worker',
    type: 'popupReady',
    tabId,
  }).catch((error) => console.error('Worker ready notification failed:', error));
};

export const setVolume = (tabId: number, value: number): void => {
  sendChromeMessage({
    target: 'offscreen',
    type: 'volume',
    tabId,
    value,
  }).catch((error) => console.error('Set volume failed:', error));
};

export const setPan = (tabId: number, value: number): void => {
  sendChromeMessage({
    target: 'offscreen',
    type: 'pan',
    tabId,
    value,
  }).catch((error) => console.error('Set pan failed:', error));
};

export const setMono = (tabId: number, value: boolean): Promise<boolean> => {
  return sendChromeMessage({
    target: 'offscreen',
    type: 'setMono',
    tabId,
    value,
  });
};

export const getMono = (tabId: number): Promise<boolean> => {
  return sendChromeMessage({
    target: 'offscreen',
    type: 'getMono',
    tabId,
  });
};

export const setInvert = (tabId: number, value: boolean): Promise<boolean> => {
  return sendChromeMessage({
    target: 'offscreen',
    type: 'setInvert',
    tabId,
    value,
  });
};

export const getInvert = (tabId: number): Promise<boolean> => {
  return sendChromeMessage({
    target: 'offscreen',
    type: 'getInvert',
    tabId,
  });
};

export const setEqValue = (tabId: number, type: string, value: number): void => {
  sendChromeMessage({
    target: 'offscreen',
    type,
    tabId,
    value,
  }).catch((error) => console.error('Set EQ value failed:', error));
};

export const setCompressorValue = (tabId: number, type: string, value: number): void => {
  sendChromeMessage({
    target: 'offscreen',
    type,
    tabId,
    value,
  }).catch((error) => console.error('Set compressor value failed:', error));
};

export const loadPreset = (tabId: number, preset: EqualizerSettings): void => {
  sendChromeMessage({
    target: 'offscreen',
    type: 'loadPreset',
    tabId,
    preset,
  }).catch((error) => console.error('Load preset failed:', error));
};

export const saveSettings = (tabId: number): void => {
  sendChromeMessage({
    target: 'offscreen',
    type: 'saveSettings',
    tabId,
  }).catch((error) => console.error('Save settings failed:', error));
};

export const loadSavedSettings = (tabId: number): void => {
  sendChromeMessage({
    target: 'offscreen',
    type: 'loadSavedSettings',
    tabId,
  }).catch((error) => console.error('Load saved settings failed:', error));
};

export const deleteSavedSettings = (tabId: number): void => {
  sendChromeMessage({
    target: 'offscreen',
    type: 'deleteSavedSettings',
    tabId,
  }).catch((error) => console.error('Delete saved settings failed:', error));
};

export const resetSettings = (tabId: number): void => {
  sendChromeMessage({
    target: 'offscreen',
    type: 'reset',
    tabId,
  }).catch((error) => console.error('Reset settings failed:', error));
};

export const powerOff = (tabId: number): Promise<{ success: boolean }> => {
  return sendChromeMessage({
    target: 'offscreen',
    type: 'powerOff',
    tabId,
  });
};

export const getStorageData = async (): Promise<any> => {
  return await browser.storage.sync.get();
};
