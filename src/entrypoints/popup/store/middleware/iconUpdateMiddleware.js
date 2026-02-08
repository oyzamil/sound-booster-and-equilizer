// Middleware для оновлення іконки браузера при зміні стану isEnable
import logger from '../../utils/logger';

async function getActiveTabId() {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) return null;
    return tabs[0].id ?? null;
  } catch (e) {
    console.error('Failed to get active tab ID:', e);
    return null;
  }
}

const iconUpdateMiddleware = (store) => (next) => async (action) => {
  const result = next(action);
  // Відстежуємо зміну isEnable
  if (
    action.type === 'ui/setIsEnable' ||
    action.type === 'ui/initializeFromStorage' ||
    action.type === 'audio/toggleEnable/fulfilled'
  ) {
    const state = store.getState();

    const { isLoaded, isEnable } = state.ui;
    if (isLoaded) {
      try {
        const tabId = await getActiveTabId();
        /* eslint-disable no-undef */
        if (isEnable) {
          browser.action.setBadgeText({ tabId, text: 'ON' });
          browser.action.setBadgeBackgroundColor({ color: '#f97316' });
          browser.action.setBadgeTextColor({ color: '#FFFFFF' });
        } else {
          browser.action.setBadgeText({ tabId, text: null });
        }
      } catch (e) {
        logger.error('Error updating browser icon', e, {
          action: action.type,
          isEnable,
        });
      }
    }
  }

  // Також оновлюємо іконку при завантаженні даних, якщо isEnable вже встановлено
  if (action.type === 'audio/loadInitialData/fulfilled') {
    const state = store.getState();
    const { isLoaded, isEnable } = state.ui;
    if (isLoaded) {
      try {
        const tabId = await getActiveTabId();
        if (isEnable) {
          browser.action.setBadgeText({ tabId, text: 'ON' });
          browser.action.setBadgeBackgroundColor({ color: '#f97316' });
          browser.action.setBadgeTextColor({ color: '#FFFFFF' });
        } else {
          browser.action.setBadgeText({ tabId, text: null });
        }
      } catch (e) {
        logger.error('Error updating browser icon after data load', e, {
          isEnable,
        });
      }
    }
  }

  return result;
};

export default iconUpdateMiddleware;
