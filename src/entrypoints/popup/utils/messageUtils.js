import { getCurrentTab } from '../Services';

// Helper function for sending messages (non-thunk version for real-time updates)
export const sendMessageToBackground = async (action, data, skipTab = false) => {
  try {
    const realTimeActions = [
      'change_equalizer',
      'change_volume',
      'change_chorus',
      'change_convolver',
      'change_compressor',
      'change_pitch',
      'change_balance',
      'change_mono',
      'change_invert',
    ];
    const isRealTimeAction = realTimeActions.includes(action);

    let tab = null;
    if (!skipTab && (!isRealTimeAction || action === 'changeStatus')) {
      try {
        tab = await getCurrentTab();

        if (!tab || !tab.id) {
          return {
            status: false,
            message: 'INVALID_TAB',
            error: 'No valid tab found',
          };
        }
      } catch (error) {
        console.error('Error getting current tab:', error);
        return {
          status: false,
          message: 'INVALID_TAB',
          error: error.message || 'No valid tab found',
        };
      }
    } else {
      tab = { id: null };
    }

    return new Promise((resolve) => {
      try {
        /* eslint-disable no-undef */
        browser.runtime.sendMessage({ type: action, value: data, tab: tab }, (response) => {
          if (browser.runtime.lastError) {
            console.error('Error sending message:', browser.runtime.lastError);
            resolve({
              status: false,
              message: 'MESSAGE_ERROR',
              error: browser.runtime.lastError.message,
            });
          } else {
            resolve(response || { status: false });
          }
        });
      } catch (e) {
        console.error('Exception in sendMessage:', e);
        resolve({
          status: false,
          message: 'EXCEPTION',
          error: e.message,
        });
      }
    });
  } catch (e) {
    console.error('Error in sendMessage:', e);
    return {
      status: false,
      message: 'ERROR',
      error: e.message,
    };
  }
};
