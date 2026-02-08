import createOffscreenDocument from './createOffscreenDocument.js';

/**
 * Function to sleep for a given number of milliseconds
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Function to capture a tab and start audio processing.
 *
 * @param {number} tabId - The ID of the tab to capture.
 * @param {number} volume - The volume value to set.
 */
const captureTab = async (tabId, volume = 1) => {
  try {
    console.log(`[captureTab] Starting capture for tabId: ${tabId}, volume: ${volume}`);

    await createOffscreenDocument();

    // Wait for offscreen document to be ready and scripts to load
    await sleep(300);

    let capturedTabs = [];
    try {
      capturedTabs = await browser.tabCapture.getCapturedTabs();
      console.log(`[captureTab] Currently captured tabs:`, capturedTabs);
    } catch (error) {
      console.error('Error getting captured tabs:', error);
      // Continue anyway - might be first capture
    }

    const isAlreadyCaptured = capturedTabs.some((tab) => tab.tabId === tabId);
    console.log(`[captureTab] Tab ${tabId} already captured: ${isAlreadyCaptured}`);

    if (!isAlreadyCaptured) {
      let streamId;
      try {
        console.log(`[captureTab] Requesting media stream ID for tabId: ${tabId}`);
        streamId = await browser.tabCapture.getMediaStreamId({
          targetTabId: tabId,
        });
        console.log(`[captureTab] Got streamId: ${streamId}`);
      } catch (error) {
        console.error(`[captureTab] Error getting media stream ID for tabId ${tabId}:`, error);
        throw new Error(`Failed to get media stream ID: ${error.message}`);
      }

      if (!streamId) {
        throw new Error('Stream ID is null or undefined');
      }

      // Use callback instead of await for sendMessage
      return new Promise((resolve, reject) => {
        console.log(`[captureTab] Sending startRecording message to offscreen for tabId: ${tabId}`);
        browser.runtime.sendMessage(
          {
            name: 'startRecording',
            target: 'offscreen',
            streamId,
            tabId,
            value: volume,
          },
          (response) => {
            if (browser.runtime.lastError) {
              console.error(
                `[captureTab] Error sending startRecording to offscreen:`,
                browser.runtime.lastError
              );
              // Retry after a short delay
              console.log(`[captureTab] Retrying startRecording after 200ms...`);
              setTimeout(() => {
                browser.runtime.sendMessage(
                  {
                    name: 'startRecording',
                    target: 'offscreen',
                    streamId,
                    tabId,
                    value: volume,
                  },
                  (retryResponse) => {
                    if (browser.runtime.lastError) {
                      console.error(`[captureTab] Retry failed:`, browser.runtime.lastError);
                      reject(
                        new Error(`Failed to start recording: ${browser.runtime.lastError.message}`)
                      );
                    } else {
                      console.log(`[captureTab] Retry successful, response:`, retryResponse);
                      resolve(retryResponse || { status: true });
                    }
                  }
                );
              }, 200);
            } else {
              console.log(`[captureTab] startRecording successful, response:`, response);
              resolve(response || { status: true });
            }
          }
        );
      });
    } else {
      // Tab already captured according to browser.tabCapture, but need to verify it exists in offscreen
      console.log(`[captureTab] Tab already captured, checking if it exists in offscreen...`);
      return new Promise((resolve, reject) => {
        // First, check if tab exists in offscreen by trying to set volume
        browser.runtime.sendMessage(
          {
            name: 'setVolume',
            target: 'offscreen',
            tabId,
            value: volume,
          },
          (response) => {
            if (browser.runtime.lastError) {
              console.error(
                `[captureTab] Error sending setVolume to offscreen:`,
                browser.runtime.lastError
              );
              reject(new Error(`Failed to set volume: ${browser.runtime.lastError.message}`));
            } else if (
              response &&
              response.status === false &&
              response.message === 'TAB_NOT_FOUND'
            ) {
              // Tab is marked as captured but doesn't exist in offscreen - need to recapture
              console.log(
                `[captureTab] Tab marked as captured but not found in offscreen, recapturing...`
              );
              // Get new streamId and recapture
              browser.tabCapture
                .getMediaStreamId({
                  targetTabId: tabId,
                })
                .then((streamId) => {
                  console.log(`[captureTab] Got new streamId for recapture: ${streamId}`);
                  browser.runtime.sendMessage(
                    {
                      name: 'startRecording',
                      target: 'offscreen',
                      streamId,
                      tabId,
                      value: volume,
                    },
                    (recaptureResponse) => {
                      if (browser.runtime.lastError) {
                        console.error(`[captureTab] Error recapturing:`, browser.runtime.lastError);
                        reject(
                          new Error(`Failed to recapture: ${browser.runtime.lastError.message}`)
                        );
                      } else {
                        console.log(
                          `[captureTab] Recapture successful, response:`,
                          recaptureResponse
                        );
                        resolve(recaptureResponse || { status: true });
                      }
                    }
                  );
                })
                .catch((error) => {
                  console.error(`[captureTab] Error getting streamId for recapture:`, error);
                  reject(new Error(`Failed to get streamId for recapture: ${error.message}`));
                });
            } else {
              console.log(`[captureTab] setVolume successful, response:`, response);
              resolve(response || { status: true });
            }
          }
        );
      });
    }
  } catch (error) {
    console.error(`[captureTab] Error in captureTab for tabId ${tabId}:`, error);
    throw error;
  }
};

/**
 * Function to dispose of a tab's audio processing.
 *
 * @param {number} tabId - The ID of the tab to dispose.
 */
const disposeTab = (tabId) => {
  browser.runtime.sendMessage({
    name: 'disposeTab',
    target: 'offscreen',
    tabId,
  });
};

export { captureTab, disposeTab };
