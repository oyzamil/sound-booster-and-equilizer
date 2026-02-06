browser.runtime.onMessage.addListener(
  (
    message: Message,
    sender: Browser.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    const { target, type, value, tabId, streamId, preset, state } = message;

    if (target !== 'offscreen') {
      return false;
    }

    const index = tabId ? getCapturedTabIndex(tabId) : -1;

    switch (type) {
      case 'captureTab':
        if (streamId && tabId) {
          captureTab(streamId, tabId).catch((error) => console.error('Capture error:', error));
        }
        return false;

      case 'loadCapturedTab':
        if (index !== -1 && tabId) {
          loadCapturedTab(index, tabId).catch((error) => console.error('Load error:', error));
        }
        return false;

      case 'powerOff':
        if (index !== -1) {
          powerOffODDSCREEN(index);
          sendResponse({ success: true });
        }
        return false;

      case 'reset':
        if (index !== -1 && tabId) {
          capturedTabsArr[index]
            .resetSettings()
            .then(() => loadCapturedTab(index, tabId!))
            .catch((error) => console.error('Reset error:', error));
        }
        return false;

      case 'deleteSavedSettings':
        browser.runtime.sendMessage({ target: 'worker', type: 'deleteSavedSettings' });
        return false;

      case 'loadSavedSettings':
        if (index !== -1 && tabId) {
          loadSavedSettingsOFFSCREEN(index, tabId).catch((error) =>
            console.error('Load saved error:', error)
          );
        }
        return false;

      case 'loadPreset':
        if (index !== -1 && tabId && preset) {
          loadPresetOFFSCREEN(index, tabId, preset).catch((error) =>
            console.error('Load preset error:', error)
          );
        }
        return false;

      case 'saveSettings':
        if (index !== -1) {
          capturedTabsArr[index]
            .saveSettings()
            .catch((error) => console.error('Save error:', error));
        }
        return false;

      case 'volume':
        if (index !== -1 && value !== undefined) {
          capturedTabsArr[index].volumeGainNode.gain.value = value;
        }
        return false;

      case 'getVolume':
        if (index !== -1) {
          sendResponse(capturedTabsArr[index].volumeGainNode.gain.value);
        }
        return false;

      case 'threshold':
      case 'attack':
      case 'release':
      case 'ratio':
      case 'knee':
        if (index !== -1 && value !== undefined) {
          (
            capturedTabsArr[index].compressor[type as keyof DynamicsCompressorNode] as AudioParam
          ).value = value;
        }
        return false;

      case 'twenty':
      case 'fifty':
      case 'oneHundred':
      case 'twoHundred':
      case 'fiveHundred':
      case 'oneThousand':
      case 'twoThousand':
      case 'fiveThousand':
      case 'tenThousand':
      case 'twentyThousand':
        if (index !== -1 && value !== undefined) {
          capturedTabsArr[index].eq[type as keyof EqualizerSettings].gain.value = value;
        }
        return false;

      case 'pan':
        if (index !== -1 && value !== undefined) {
          capturedTabsArr[index].setPan(value);
        }
        return false;

      case 'getPan':
        if (index !== -1) {
          sendResponse(capturedTabsArr[index].pan);
        }
        return false;

      case 'setMono':
        if (index !== -1 && value !== undefined) {
          capturedTabsArr[index].setMono(value);
          sendResponse(true);
        }
        return false;

      case 'getMono':
        if (index !== -1) {
          sendResponse(capturedTabsArr[index].mono);
        }
        return false;

      case 'setInvert':
        if (index !== -1 && value !== undefined) {
          capturedTabsArr[index].setInvert(value);
          sendResponse(true);
        }
        return false;

      case 'getInvert':
        if (index !== -1) {
          sendResponse(capturedTabsArr[index].invert);
        }
        return false;

      case 'tabRemoved':
        if (index !== -1) {
          capturedTabsArr[index].stopAudio();
          capturedTabsArr.splice(index, 1);
        }
        sendResponse(true);
        return false;

      case 'getIndex':
        sendResponse(index);
        return false;

      case 'saveWindowState':
        if (index !== -1 && state) {
          capturedTabsArr[index].windowState = state;
        }
        return false;

      case 'getSavedWindowState':
        if (index !== -1) {
          sendResponse({ state: capturedTabsArr[index].windowState });
        } else {
          sendResponse({ state });
        }
        return false;

      default:
        console.error('Unknown offscreen message type:', type);
        return false;
    }
  }
);

// Global variables
const capturedTabsArr: CapturedAudioObject[] = [];

// Helper functions
async function getDefaultStorageObject(): Promise<AudioSettings> {
  return await browser.runtime.sendMessage({
    target: 'worker',
    type: 'getDefaultSettings',
  });
}

async function getSavedStorageObject(): Promise<{ settings: AudioSettings }> {
  return await browser.runtime.sendMessage({
    target: 'worker',
    type: 'getSavedSettings',
  });
}

async function getUserMedia(streamId: string): Promise<MediaStream> {
  return await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        browserMediaSource: 'tab',
        browserMediaSourceId: streamId,
      },
    } as any,
  });
}

async function getStream(streamId: string): Promise<MediaStream | undefined> {
  try {
    return await getUserMedia(streamId);
  } catch (error) {
    console.error('Error getting audio stream:', error);
    return undefined;
  }
}

async function sendAudioSettingsToPopup(
  settings: Partial<AudioSettings>,
  tabId: number
): Promise<void> {
  browser.runtime
    .sendMessage({
      target: 'popup',
      type: 'load',
      settings,
      tabId,
    })
    .catch((error) => console.warn('Popup might be closed:', error));
}

async function loadSavedSettingsOFFSCREEN(index: number, tabId: number): Promise<void> {
  const { settings } = await getSavedStorageObject();
  capturedTabsArr[index].loadSettings(settings);
  await sendAudioSettingsToPopup(settings, tabId);
}

async function captureTab(streamId: string, tabId: number): Promise<void> {
  const { settings } = await getSavedStorageObject();
  const audioStream = await getStream(streamId);

  if (audioStream) {
    capturedTabsArr.push(
      new CapturedAudioObject({
        tabId,
        stream: audioStream,
        settings,
      })
    );
    await sendAudioSettingsToPopup(settings, tabId);
  }
}

async function loadCapturedTab(index: number, tabId: number): Promise<void> {
  const settings = await capturedTabsArr[index].getSettings();
  await sendAudioSettingsToPopup(settings, tabId);
}

async function loadPresetOFFSCREEN(
  index: number,
  tabId: number,
  preset: EqualizerSettings
): Promise<void> {
  const eqSettings: Partial<AudioSettings> = { eq: preset };
  capturedTabsArr[index].loadSettings(eqSettings);
  await sendAudioSettingsToPopup(eqSettings, tabId);
}

function powerOffODDSCREEN(index: number): void {
  capturedTabsArr[index].stopAudio();
  capturedTabsArr.splice(index, 1);
}

function getCapturedTabIndex(id: number): number {
  return capturedTabsArr.findIndex(({ tabId }) => tabId === id);
}

class CapturedAudioObject {
  tabId: number;
  audioCtx: AudioContext;
  streamOutput!: MediaStreamAudioSourceNode;
  volumeGainNode!: GainNode;
  leftInvertGainNode!: GainNode;
  rightInvertGainNode!: GainNode;
  invertSplitter!: ChannelSplitterNode;
  invertMerger!: ChannelMergerNode;
  pan: number = 0;
  panSplitter!: ChannelSplitterNode;
  leftPanGain!: GainNode;
  rightPanGain!: GainNode;
  panMerger!: ChannelMergerNode;
  mono: boolean = false;
  monoSplitter!: ChannelSplitterNode;
  monoGain!: GainNode;
  stereoGain!: GainNode;
  monoMerger!: ChannelMergerNode;
  stereoMerger!: ChannelMergerNode;
  invert: boolean = false;
  compressor!: DynamicsCompressorNode;
  eq!: Record<keyof EqualizerSettings, BiquadFilterNode>;
  windowState?: Browser.windows.WindowState;

  constructor({ tabId, stream, settings }: CapturedAudioConfig) {
    this.tabId = tabId;
    this.audioCtx = new AudioContext({ latencyHint: 'interactive' });
    this.setupAudioNodes(stream, settings);
  }

  setupAudioNodes(stream: MediaStream, settings: AudioSettings): void {
    this.streamOutput = this.createMediaStreamSource(stream);
    this.setupVolume(settings.volume);
    this.setupPan(settings.pan);
    this.setupMono(settings.mono);
    this.setupInvert(settings.invert);
    this.setupCompressor(settings.compressor);
    this.setupEqualizer(settings.eq);
    this.connectAudioNodes();
  }

  createMediaStreamSource(stream: MediaStream): MediaStreamAudioSourceNode {
    return this.audioCtx.createMediaStreamSource(stream);
  }

  setupVolume(volume: number): void {
    this.volumeGainNode = this.audioCtx.createGain();
    this.leftInvertGainNode = this.audioCtx.createGain();
    this.rightInvertGainNode = this.audioCtx.createGain();
    this.invertSplitter = this.audioCtx.createChannelSplitter(2);
    this.invertMerger = this.audioCtx.createChannelMerger(2);
    this.volumeGainNode.gain.value = volume;
  }

  setupPan(pan: number): void {
    this.pan = pan;
    this.panSplitter = this.audioCtx.createChannelSplitter(2);
    this.leftPanGain = this.audioCtx.createGain();
    this.rightPanGain = this.audioCtx.createGain();
    this.panMerger = this.audioCtx.createChannelMerger(2);
  }

  setupMono(mono: boolean): void {
    this.mono = mono;
    this.monoSplitter = this.audioCtx.createChannelSplitter(2);
    this.monoGain = this.audioCtx.createGain();
    this.stereoGain = this.audioCtx.createGain();
    this.monoMerger = this.audioCtx.createChannelMerger(1);
    this.stereoMerger = this.audioCtx.createChannelMerger(2);
    this.monoGain.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
    this.stereoGain.gain.setValueAtTime(1, this.audioCtx.currentTime);
  }

  setupInvert(invert: boolean): void {
    this.invert = invert;
  }

  setupCompressor(compressorSettings: CompressorSettings): void {
    this.compressor = this.audioCtx.createDynamicsCompressor();

    Object.entries(compressorSettings).forEach(([key, value]) => {
      (this.compressor[key as keyof DynamicsCompressorNode] as AudioParam).setValueAtTime(
        value,
        this.audioCtx.currentTime
      );
    });

    this.compressor.attack.value = Number(this.compressor.attack.value.toFixed(1));
  }

  setupEqualizer(eq: EqualizerSettings): void {
    const eqStructureObj: Record<keyof EqualizerSettings, EqualizerBand> = {
      twenty: { type: 'lowshelf', frequency: 32 },
      fifty: { type: 'peaking', frequency: 64 },
      oneHundred: { type: 'peaking', frequency: 125 },
      twoHundred: { type: 'peaking', frequency: 250 },
      fiveHundred: { type: 'peaking', frequency: 500 },
      oneThousand: { type: 'peaking', frequency: 1000 },
      twoThousand: { type: 'peaking', frequency: 2000 },
      fiveThousand: { type: 'peaking', frequency: 4000 },
      tenThousand: { type: 'peaking', frequency: 8000 },
      twentyThousand: { type: 'highshelf', frequency: 16000 },
    };

    this.eq = {} as Record<keyof EqualizerSettings, BiquadFilterNode>;

    Object.entries(eq).forEach(([key, value]) => {
      const bandKey = key as keyof EqualizerSettings;
      this.eq[bandKey] = this.audioCtx.createBiquadFilter();

      const currentFreq = this.eq[bandKey];
      const { currentTime } = this.audioCtx;
      const { type, frequency } = eqStructureObj[bandKey];

      currentFreq.gain.value = value;
      currentFreq.type = type;
      currentFreq.frequency.setValueAtTime(frequency, currentTime);

      if (!key.includes('twenty')) {
        currentFreq.Q.setValueAtTime(5, currentTime);
      }
    });
  }

  connectAudioNodes(): void {
    const { streamOutput, invertSplitter, leftInvertGainNode, rightInvertGainNode, invertMerger } =
      this;
    const { panSplitter, leftPanGain, rightPanGain, panMerger } = this;

    // Invert chain
    streamOutput.connect(invertSplitter);
    invertSplitter.connect(leftInvertGainNode, 0, 0);
    invertSplitter.connect(rightInvertGainNode, 1, 0);
    leftInvertGainNode.connect(invertMerger, 0, 0);
    rightInvertGainNode.connect(invertMerger, 0, 1);

    if (this.invert) {
      this.setInvert(true);
    }

    // Pan chain
    invertMerger.connect(panSplitter);
    panSplitter.connect(leftPanGain, 0);
    panSplitter.connect(rightPanGain, 1);
    leftPanGain.connect(panMerger, 0, 0);
    rightPanGain.connect(panMerger, 0, 1);

    this.setMono(this.mono);

    // EQ chain
    const {
      twenty,
      fifty,
      oneHundred,
      twoHundred,
      fiveHundred,
      oneThousand,
      twoThousand,
      fiveThousand,
      tenThousand,
      twentyThousand,
    } = this.eq;

    twenty.connect(fifty);
    fifty.connect(oneHundred);
    oneHundred.connect(twoHundred);
    twoHundred.connect(fiveHundred);
    fiveHundred.connect(oneThousand);
    oneThousand.connect(twoThousand);
    twoThousand.connect(fiveThousand);
    fiveThousand.connect(tenThousand);
    tenThousand.connect(twentyThousand);
    twentyThousand.connect(this.compressor);

    // Output chain
    this.compressor.connect(this.volumeGainNode);
    this.volumeGainNode.connect(this.audioCtx.destination);
  }

  setMono(isMono: boolean): void {
    this.mono = isMono;

    // Disconnect all
    this.panMerger.disconnect();
    this.monoSplitter.disconnect();
    this.monoMerger.disconnect();
    this.stereoMerger.disconnect();
    this.monoGain.disconnect();
    this.stereoGain.disconnect();

    if (isMono) {
      this.panMerger.connect(this.monoSplitter);
      this.monoSplitter.connect(this.monoMerger, 0, 0);
      this.monoSplitter.connect(this.monoMerger, 1, 0);
      this.monoMerger.connect(this.monoGain);
      this.monoGain.connect(this.eq.twenty);
    } else {
      this.panMerger.connect(this.eq.twenty);
    }
  }

  setInvert(invert: boolean): void {
    this.leftInvertGainNode.gain.value = invert ? -1 : 1;
    this.invert = invert;
  }

  stopAudio(): boolean {
    try {
      this.streamOutput.disconnect();
      this.volumeGainNode?.disconnect();
      this.compressor?.disconnect();
      Object.values(this.eq || {}).forEach((band) => band.disconnect?.());
    } catch (e) {
      console.warn('Disconnect error:', e);
    }

    const audioTracks = this.streamOutput.mediaStream.getAudioTracks();
    if (audioTracks.length > 0) {
      audioTracks[0].stop();
    }

    this.audioCtx.close();
    return true;
  }

  async resetSettings(): Promise<void> {
    const defaultSettings = await getDefaultStorageObject();

    Object.entries(defaultSettings.compressor).forEach(([key, value]) => {
      (this.compressor[key as keyof DynamicsCompressorNode] as AudioParam).value = value;
    });

    Object.entries(defaultSettings.eq).forEach(([key, value]) => {
      this.eq[key as keyof EqualizerSettings].gain.value = value;
    });

    this.setPan(0);
    this.setMono(false);
    this.setInvert(false);
    this.volumeGainNode.gain.value = 1;
  }

  setPan(val: number): void {
    const clampedPan = Math.max(-1, Math.min(1, Number(val)));
    this.pan = clampedPan;

    const { currentTime } = this.audioCtx;

    if (val > 0) {
      this.leftPanGain.gain.setValueAtTime(1 - clampedPan, currentTime);
      this.rightPanGain.gain.setValueAtTime(1, currentTime);
    } else {
      this.leftPanGain.gain.setValueAtTime(1, currentTime);
      this.rightPanGain.gain.setValueAtTime(1 + clampedPan, currentTime);
    }
  }

  async saveSettings(): Promise<void> {
    const { eq, compressor, mono, pan, volumeGainNode, invert } = this;
    const defaultSettings = await getDefaultStorageObject();

    const settingsObj: AudioSettings = {
      compressor: {} as CompressorSettings,
      eq: {} as EqualizerSettings,
      mono,
      invert,
      pan,
      volume: volumeGainNode.gain.value,
    };

    Object.keys(defaultSettings.compressor).forEach((key) => {
      const k = key as keyof CompressorSettings;
      settingsObj.compressor[k] = (
        compressor[k as keyof DynamicsCompressorNode] as AudioParam
      ).value;
    });

    Object.keys(defaultSettings.eq).forEach((key) => {
      const k = key as keyof EqualizerSettings;
      settingsObj.eq[k] = eq[k].gain.value;
    });

    browser.runtime.sendMessage({
      target: 'worker',
      type: 'saveToStorage',
      data: settingsObj,
    });
  }

  loadSettings(settings: Partial<AudioSettings>): void {
    const { compressor, eq, pan, mono, volume, invert } = settings;

    if (compressor) {
      Object.entries(compressor).forEach(([key, value]) => {
        (this.compressor[key as keyof DynamicsCompressorNode] as AudioParam).value = value;
      });
    }

    if (eq) {
      Object.entries(eq).forEach(([key, value]) => {
        this.eq[key as keyof EqualizerSettings].gain.value = value;
      });
    }

    if (pan !== undefined) {
      this.pan = pan;
      this.setPan(pan);
    }

    if (mono !== undefined) {
      this.mono = mono;
      this.setMono(mono);
    }

    if (invert !== undefined) {
      this.invert = invert;
      this.setInvert(invert);
    }

    if (volume !== undefined) {
      this.volumeGainNode.gain.value = volume;
    }
  }

  async getSettings(): Promise<AudioSettings> {
    const { volumeGainNode, eq, compressor, mono, pan, invert } = this;
    const defaultSettings = await getDefaultStorageObject();

    const currentSettings: AudioSettings = {
      mono,
      invert,
      pan,
      volume: volumeGainNode.gain.value,
      compressor: {} as CompressorSettings,
      eq: {} as EqualizerSettings,
    };

    Object.keys(defaultSettings.compressor).forEach((key) => {
      const k = key as keyof CompressorSettings;
      currentSettings.compressor[k] = (
        compressor[k as keyof DynamicsCompressorNode] as AudioParam
      ).value;
    });

    Object.keys(defaultSettings.eq).forEach((key) => {
      const k = key as keyof EqualizerSettings;
      currentSettings.eq[k] = eq[k].gain.value;
    });

    return currentSettings;
  }
}
