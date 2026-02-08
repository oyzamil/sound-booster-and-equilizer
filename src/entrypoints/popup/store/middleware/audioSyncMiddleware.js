// Middleware для автоматичної синхронізації audio параметрів з background
import logger from '../../utils/logger';
import { sendMessageToBackground } from '../../utils/messageUtils';

// Debounce timer для updateEqValue (щоб не відправляти кожну зміну окремо)
let eqUpdateTimer = null;
const EQ_UPDATE_DEBOUNCE_MS = 50; // Невелика затримка для групування швидких змін

const audioSyncMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  const state = store.getState();
  const { isLoaded, isEnable } = state.ui;
  const { eq, volume, balance, isMono, isInvert } = state.equalizer;

  // Відстежуємо actions, які потребують синхронізації з background
  const syncActions = {
    'equalizer/updateEqValue': () => {
      // Debounce для updateEqValue - відправляємо після невеликої затримки
      if (eqUpdateTimer) {
        clearTimeout(eqUpdateTimer);
      }
      eqUpdateTimer = setTimeout(() => {
        if (isLoaded && isEnable) {
          sendMessageToBackground('change_equalizer', eq, true).catch((error) => {
            logger.error('Error sending equalizer update to background', error, {
              action: 'change_equalizer',
              eqLength: eq?.length,
            });
          });
        }
      }, EQ_UPDATE_DEBOUNCE_MS);
    },
    'equalizer/setEq': () => {
      // Відправляємо одразу при setEq (наприклад, при завантаженні preset)
      if (isLoaded && isEnable) {
        sendMessageToBackground('change_equalizer', eq, true).catch((error) => {
          logger.error('Error sending equalizer update to background', error, {
            action: 'change_equalizer',
            eqLength: eq?.length,
          });
        });
      }
    },
    'equalizer/loadPreset': () => {
      // Відправляємо одразу при завантаженні preset (коли змінюється вибраний пресет)
      if (isLoaded && isEnable) {
        sendMessageToBackground('change_equalizer', eq, true).catch((error) => {
          logger.error('Error sending preset equalizer values to background', error, {
            action: 'change_equalizer',
            eqLength: eq?.length,
          });
        });
      }
    },
    'equalizer/resetEqualizer': () => {
      // We send immediately when the preset is loaded (when the selected preset changes)
      if (isLoaded && isEnable) {
        sendMessageToBackground('reset_equalizer', null, true).catch((error) => {
          logger.error('Error sending preset equalizer values to background', error, {
            action: 'reset_equalizer',
          });
        });
      }
    },
    'equalizer/setVolume': () => {
      // We send immediately when the volume changes
      if (isLoaded && isEnable) {
        sendMessageToBackground('change_volume', volume, true).catch((error) => {
          logger.error('Error sending volume update to background', error, {
            action: 'change_volume',
            volume,
          });
        });
      }
    },
    'equalizer/setBalance': () => {
      // We send immediately when the volume changes
      if (isLoaded && isEnable) {
        sendMessageToBackground('change_balance', balance, true).catch((error) => {
          logger.error('Error sending balance update to background', error, {
            action: 'change_balance',
            balance,
          });
        });
      }
    },
    'equalizer/setMono': () => {
      // We send immediately when the volume changes
      if (isLoaded && isEnable) {
        sendMessageToBackground('change_mono', isMono, true).catch((error) => {
          logger.error('Error sending isMono update to background', error, {
            action: 'change_mono',
            isMono,
          });
        });
      }
    },
    'equalizer/setInvert': () => {
      // We send immediately when the volume changes
      if (isLoaded && isEnable) {
        sendMessageToBackground('change_invert', isInvert, true).catch((error) => {
          logger.error('Error sending isInvert update to background', error, {
            action: 'change_invert',
            isInvert,
          });
        });
      }
    },
    'ui/setIsEnable': () => {
      const newIsEnable = state.ui.isEnable;

      // If the equalizer is just enabled, send the current values
      // This is a backup mechanism, the main sending takes place in the toggleEnable thunk
      if (isLoaded && newIsEnable) {
        // Невелика затримка для забезпечення готовності offscreen document
        setTimeout(() => {
          sendMessageToBackground('change_equalizer', eq, true).catch((error) => {
            logger.error('Error sending initial equalizer values after enable (backup)', error, {
              action: 'change_equalizer',
              eqLength: eq?.length,
            });
          });
          sendMessageToBackground('change_volume', volume, true).catch((error) => {
            logger.error('Error sending initial volume after enable (backup)', error, {
              action: 'change_volume',
              volume,
            });
          });
          sendMessageToBackground('change_balance', balance, true).catch((error) => {
            logger.error('Error sending initial balance after enable (backup)', error, {
              action: 'change_balance',
              balance,
            });
          });
          sendMessageToBackground('change_mono', isMono, true).catch((error) => {
            logger.error('Error sending initial isMono after enable (backup)', error, {
              action: 'change_mono',
              isMono,
            });
          });
          sendMessageToBackground('change_invert', isInvert, true).catch((error) => {
            logger.error('Error sending initial isInvert after enable (backup)', error, {
              action: 'change_invert',
              isInvert,
            });
          });
        }, 500); // Трохи довша затримка як backup механізм
      }
    },
  };

  // Виконуємо синхронізацію якщо action потрібен
  if (syncActions[action.type]) {
    syncActions[action.type]();
  }

  return result;
};

export default audioSyncMiddleware;
