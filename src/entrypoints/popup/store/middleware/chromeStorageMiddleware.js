// Middleware for synchronizing Redux state with Chrome storage and checking manual changes
import { loadPreset, setHasManualChanges } from '../slices/equalizerSlice';

const chromeStorageMiddleware = (store) => (next) => (action) => {
  // We get the current state BEFORE executing the action
  const stateBefore = store.getState();

  const result = next(action);

  // We get the updated state AFTER action
  const state = store.getState();

  // Automatically load the preset when the selectedPreset changes (if this is not a loadPreset action)
  if (action.type === 'equalizer/setSelectedPreset') {
    const { isLoaded } = state.ui;
    // We get the selectedPreset BEFORE the action is executed
    const currentSelectedPreset = stateBefore.equalizer.selectedPreset;
    // We get a new selectedPreset from action.payload
    const newSelectedPreset = action.payload;
    const { presets } = state.equalizer;

    console.log('[chromeStorageMiddleware] setSelectedPreset:', {
      newSelectedPreset,
      currentSelectedPreset,
      isLoaded,
      presetsCount: presets.length,
      willLoad: newSelectedPreset !== currentSelectedPreset,
    });

    // We load the preset only if it has really changed and the data is loaded
    if (
      isLoaded &&
      presets.length > 0 &&
      newSelectedPreset &&
      newSelectedPreset !== currentSelectedPreset
    ) {
      const preset = presets.find((p) => p.key === newSelectedPreset);
      console.log('[chromeStorageMiddleware] Found preset:', {
        presetKey: newSelectedPreset,
        presetFound: !!preset,
        hasEq: !!(preset && preset.eq),
        eqLength: preset?.eq?.length,
        eq: preset?.eq,
      });

      if (preset && preset.eq) {
        // Download the preset automatically
        console.log('[chromeStorageMiddleware] Dispatching loadPreset for:', newSelectedPreset);
        store.dispatch(loadPreset(newSelectedPreset));
      } else {
        console.warn('[chromeStorageMiddleware] Preset not found or missing eq:', {
          presetKey: newSelectedPreset,
          presetFound: !!preset,
          hasEq: !!(preset && preset.eq),
        });
      }
    } else {
      console.warn('[chromeStorageMiddleware] Cannot load preset:', {
        isLoaded,
        presetsCount: presets.length,
        newSelectedPreset,
        currentSelectedPreset,
        isDifferent: newSelectedPreset !== currentSelectedPreset,
      });
    }
  }

  // Check manual changes for actions that change eq or selectedPreset
  const manualChangesCheckActions = [
    'equalizer/updateEqValue',
    'equalizer/setEq',
    'equalizer/setSelectedPreset',
    'equalizer/loadPreset',
    'equalizer/resetEqualizer',
  ];

  if (manualChangesCheckActions.includes(action.type)) {
    const { isLoaded } = state.ui;
    const { eq, selectedPreset, presets } = state.equalizer;

    if (isLoaded && presets.length > 0 && selectedPreset) {
      const currentPreset = presets.find((p) => p.key === selectedPreset);

      if (currentPreset && currentPreset.eq) {
        // Compare the current eq with the preset eq
        const hasChanges = eq.some((val, index) => {
          const presetVal = currentPreset.eq[index];
          if (presetVal === undefined) return false;
          return Math.abs(val - presetVal) > 0.01; // Use a small threshold to compare float
        });

        // Update hasManualChanges only if the value has changed
        if (state.equalizer.hasManualChanges !== hasChanges) {
          store.dispatch(setHasManualChanges(hasChanges));
        }
      }
    }
  }

  // We synchronize only certain actions with Chrome storage
  const syncActions = [
    'equalizer/setEq',
    'equalizer/updateEqValue',
    'equalizer/setVolume',
    'equalizer/setBalance',
    'equalizer/setMono',
    'equalizer/setInvert',
    'equalizer/setSelectedPreset',
    'equalizer/loadPreset',
    'equalizer/addPreset',
    'equalizer/resetEqualizer',
    'equalizer/updatePreset',
    'equalizer/deletePreset',
    'effects/updateChorus',
    'effects/updateConvolver',
    'effects/updateCompressor',
  ];

  if (syncActions.includes(action.type)) {
    try {
      /* eslint-disable no-undef */
      const storageData = {
        eq: state.equalizer.eq,
        volume: state.equalizer.volume,
        balance: state.equalizer.balance,
        isMono: state.equalizer.isMono,
        isInvert: state.equalizer.isInvert,
        selectedPreset: state.equalizer.selectedPreset,
        chorus: state.effects.chorus,
        convolver: state.effects.convolver,
        compressor: state.effects.compressor,
      };

      // Also save custom presets if they were modified
      if (action.type.includes('Preset')) {
        const customPresets = state.equalizer.presets.filter((p) => p.isCustom === true);
        storageData.customPresets = customPresets;
      }

      browser.storage.local.set(storageData, () => {
        // Storage updated
      });
    } catch (e) {
      console.error('Error syncing to Chrome storage:', e);
    }
  }

  return result;
};

export default chromeStorageMiddleware;
