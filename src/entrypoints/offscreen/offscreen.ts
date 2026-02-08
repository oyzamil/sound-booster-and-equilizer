import { AudioEngine } from './utils/AudioEngine';

interface BrowserMessage {
  target: string;
  name: string;
  streamId: string;
  tabId: number;
  value?: any;
  type?: string;
}

interface BrowserResponse {
  status: boolean;
  message?: string;
  error?: string;
}

const tabs: Record<number, AudioEngine> = {};

const defaultSettings: any = {
  isChorus: false,
  isConvolver: false,
  compressor: {
    threshold: -20,
    attack: 0,
    release: 250,
    makeupGain: 1,
    ratio: 4,
    knee: 5,
    bypass: false,
    automakeup: false,
  },
  convolver: {
    highCut: 22050,
    lowCut: 20,
    dryLevel: 1,
    wetLevel: 1,
    level: 1,
    bypass: false,
  },
  chorus: {
    rate: 0,
    depth: 0.7,
    feedback: 0.4,
    delay: 0.0045,
  },
  isMono: false,
  isInvert: false,
  balance: 0,
  isPitch: false,
  volume: 1,
  eq: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

async function cleanupTab(tabId: number) {
  const graph = tabs[tabId];
  if (!graph) return;

  try {
    await graph.destroy();
  } catch (e) {
    console.error('Error destroying AudioGraph:', e);
  }

  delete tabs[tabId];
}

const captureTab = async (streamId: string, tabId: number): Promise<void> => {
  try {
    console.log(
      `[offscreen captureTab] Starting capture with streamId: ${streamId}, tabId: ${tabId}`
    );

    if (!streamId) {
      throw new Error('StreamId is required');
    }

    const mediaStream: any = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId,
        },
      } as any,
    });

    const graph = new AudioEngine(mediaStream, tabId, defaultSettings);

    console.log(`[offscreen captureTab] Got media stream for tabId: ${tabId}`);

    mediaStream.oninactive = () => {
      cleanupTab(tabId);
    };

    tabs[tabId] = graph;

    console.log(`[offscreen captureTab] Successfully captured tabId: ${tabId}`);
  } catch (captureError: unknown) {
    console.error(`[offscreen captureTab] Error capturing tab ${tabId}:`, captureError);
    throw captureError;
  }
};

browser.runtime.onMessage.addListener(
  (
    message: BrowserMessage,
    sender: Browser.runtime.MessageSender,
    sendResponse: (response?: BrowserResponse) => void
  ): boolean => {
    if (message.target !== 'offscreen') {
      return false;
    }

    const {
      name: commandName,
      type: messageType,
      streamId: mediaStreamId,
      tabId: targetTabId,
      value: parameterValue,
    } = message;

    // Handle startRecording
    if (commandName === 'startRecording') {
      console.log(
        `[offscreen] Received startRecording for tabId: ${targetTabId}, streamId: ${mediaStreamId}`
      );

      captureTab(mediaStreamId, targetTabId)
        .then(() => {
          console.log(`[offscreen] captureTab successful for tabId: ${targetTabId}`);

          if (parameterValue !== undefined && tabs[targetTabId]) {
            tabs[targetTabId].audioGain.gain.value = parameterValue;
            console.log(`[offscreen] Set volume to ${parameterValue} for tabId: ${targetTabId}`);
          }

          sendResponse?.({ status: true });
        })
        .catch((captureError: unknown) => {
          console.error(
            `[offscreen] Error starting recording for tabId ${targetTabId}:`,
            captureError
          );
          sendResponse?.({ status: false, error: (captureError as Error).message });
        });

      return true;
    }

    if (!tabs[targetTabId]) {
      sendResponse?.({ status: false, message: 'TAB_NOT_FOUND' });
      return true;
    }

    const graph = tabs[targetTabId];
    const command = commandName || messageType;
    const value = parameterValue || message.value;
    switch (command) {
      case 'setVolume':
      case 'change_volume':
        graph.setVolume(value);
        break;

      case 'setBalance':
      case 'change_balance':
        graph.setPan(value);
        break;

      case 'setMono':
      case 'change_mono':
        graph.setMono(value);
        break;

      case 'setInvert':
      case 'change_invert':
        graph.setInvert(value);
        break;

      case 'change_equalizer':
        graph.setEQ(value);
        break;

      case 'change_compressor':
        graph.changeCompressor(value);
        break;

      case 'change_pitch':
        graph.changePitch(value);
        break;

      case 'change_convolver':
        graph.changeConvolver(value);
        break;

      case 'change_chorus':
        graph.changeChorus(value);
        break;

      case 'reset_equalizer':
        graph.reset(defaultSettings);
        break;

      case 'closeAudio':
      case 'disposeTab':
        cleanupTab(targetTabId);
        break;

      default:
        sendResponse?.({ status: false, message: 'UNKNOWN_COMMAND' });
        return true;
    }

    sendResponse?.({ status: true });
    return true;
  }
);

// browser.runtime.onMessage.addListener(
//   (
//     message: BrowserMessage,
//     sender: Browser.runtime.MessageSender,
//     sendResponse: (response?: BrowserResponse) => void
//   ): boolean => {
//     if (message.target !== 'offscreen') {
//       return false;
//     }

//     const {
//       name: commandName,
//       streamId: mediaStreamId,
//       tabId: targetTabId,
//       value: parameterValue,
//       type: messageType,
//     } = message;

//     if (commandName === 'startRecording') {
//       console.log(
//         `[offscreen] Received startRecording for tabId: ${targetTabId}, streamId: ${mediaStreamId}`
//       );

//       captureTab(mediaStreamId, targetTabId)
//         .then(() => {
//           console.log(`[offscreen] captureTab successful for tabId: ${targetTabId}`);

//           if (parameterValue !== undefined && tabs[targetTabId]) {
//             tabs[targetTabId].audioGain.gain.value = parameterValue;
//             console.log(`[offscreen] Set volume to ${parameterValue} for tabId: ${targetTabId}`);
//           }

//           if (sendResponse) {
//             sendResponse({ status: true });
//           }
//         })
//         .catch((captureError: unknown) => {
//           console.error(
//             `[offscreen] Error starting recording for tabId ${targetTabId}:`,
//             captureError
//           );

//           if (sendResponse) {
//             sendResponse({
//               status: false,
//               error: (captureError as Error).message,
//             });
//           }
//         });

//       return true;
//     }

//     if (!tabs[targetTabId]) {
//       if (sendResponse) {
//         sendResponse({
//           status: false,
//           message: 'TAB_NOT_FOUND',
//         });
//       }
//       return true;
//     }

//     const tabAudioData = tabs[targetTabId];

//     if (commandName === 'setVolume' || messageType === 'change_volume') {
//       const volumeValue = parameterValue || message.value;
//       tabAudioData.audioGain.gain.value = volumeValue;

//       if (sendResponse) {
//         return (sendResponse({ status: true }), true);
//       }
//     }
//     if (commandName === 'setBalance' || messageType === 'change_balance') {
//       const balanceValue = parameterValue || message.value;
//       applyStereoPan(tabAudioData, balanceValue);

//       if (sendResponse) {
//         return (sendResponse({ status: true }), true);
//       }
//     } else if (commandName === 'setMono' || messageType === 'change_mono') {
//       const isMono = parameterValue || message.value;
//       toggleMonoNodes(tabAudioData, isMono);

//       if (sendResponse) {
//         return (sendResponse({ status: true }), true);
//       }
//     } else if (commandName === 'setInvert' || messageType === 'change_invert') {
//       const isInvert = parameterValue || message.value;
//       applyChannelInvert(tabAudioData, isInvert);

//       if (sendResponse) {
//         return (sendResponse({ status: true }), true);
//       }
//     } else if (commandName === 'change_equalizer' || messageType === 'change_equalizer') {
//       const eqValues = parameterValue || message.value;
//       changeEqualizer(tabAudioData, eqValues);

//       if (sendResponse) {
//         return (sendResponse({ status: true }), true);
//       }
//     } else if (commandName === 'closeAudio' || messageType === 'closeAudio') {
//       cleanupTab(tabAudioData);
//       delete tabs[targetTabId];

//       if (sendResponse) {
//         return (sendResponse({ status: true }), true);
//       }
//     } else if (commandName === 'change_compressor' || messageType === 'change_compressor') {
//       const compressorValues = parameterValue || message.value;

//       changeCompressor(tabAudioData, compressorValues);

//       if (sendResponse) {
//         return (sendResponse({ status: true }), true);
//       }
//     } else if (commandName === 'change_pitch' || messageType === 'change_pitch') {
//       const pitchValue = parameterValue || message.value;

//       changePitch(tabAudioData, pitchValue);

//       if (sendResponse) {
//         return (sendResponse({ status: true }), true);
//       }
//     } else if (commandName === 'change_convolver' || messageType === 'change_convolver') {
//       const convolverValues = parameterValue || message.value;
//       changeConvolver(tabAudioData, convolverValues);

//       if (sendResponse) {
//         return (sendResponse({ status: true }), true);
//       }
//     } else if (commandName === 'change_chorus' || messageType === 'change_chorus') {
//       const chorusValues = parameterValue || message.value;
//       changeChorus(tabAudioData, chorusValues);

//       if (sendResponse) {
//         return (sendResponse({ status: true }), true);
//       }
//     } else if (commandName === 'disposeTab') {
//       cleanupTab(tabAudioData);
//       delete tabs[targetTabId];

//       if (sendResponse) {
//         return (sendResponse({ status: true }), true);
//       }
//     } else if (sendResponse) {
//       return (
//         sendResponse({
//           status: false,
//           message: 'UNKNOWN_COMMAND',
//         }),
//         true
//       );
//     }

//     return false;
//   }
// );
