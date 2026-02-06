import { config, Settings } from '@/app.config';
import { debounce } from 'lodash';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? (T[P] extends any[] ? T[P] : DeepPartial<T[P]>) : T[P];
};

type SettingsStore = {
  settings: Settings;
  saveSettings: (patch: DeepPartial<Settings>) => void;
  removeSettings: (keys: (keyof Settings)[]) => void;
  resetSettings: () => void;
};

const throttleMs = 500; // Adjust as needed (500-1200ms is typical for good UX)

function extractSettings(persisted: any) {
  return persisted?.state?.settings ?? persisted?.settings ?? null;
}

export const baseChromeAdapter = {
  getItem: (name: string) =>
    new Promise<string | null>((resolve) => {
      browser.storage.local.get([name], (result) => {
        const val = result[name];
        resolve(val != null ? JSON.stringify(val) : null);
      });
    }),

  setItem: (name: string, value: string) =>
    new Promise<void>((resolve) => {
      browser.storage.local.set({ [name]: JSON.parse(value) }, () => resolve());
    }),

  removeItem: (name: string) =>
    new Promise<void>((resolve) => {
      browser.storage.local.remove([name], () => resolve());
    }),

  // ✅ CORRECT subscribe
  subscribe: (onSettingsChange: (settings: Settings) => void) => {
    const listener: Parameters<typeof browser.storage.onChanged.addListener>[0] = (
      changes,
      area
    ) => {
      if (area !== 'local') return;

      const change = changes[config.APP.storageBucket];
      if (!change?.newValue) return;

      try {
        const nextPersisted =
          typeof change.newValue === 'string' ? JSON.parse(change.newValue) : change.newValue;

        const prevPersisted =
          typeof change.oldValue === 'string' ? JSON.parse(change.oldValue) : change.oldValue;

        const nextSettings = extractSettings(nextPersisted);
        const prevSettings = extractSettings(prevPersisted);

        if (!nextSettings) return;

        // 🔥 DEEP CHECK
        if (!isDeepEqual(prevSettings, nextSettings)) {
          onSettingsChange(nextSettings);
        }
      } catch (err) {
        console.error('[settings subscribe] parse failed', err);
      }
    };

    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  },
};

// Wrap setItem with throttle for delayed writes
const throttledSetItem = throttle(baseChromeAdapter.setItem, throttleMs, {
  leading: false, // Don't write immediately
  trailing: true, // Write after the last call in the throttle window
});

const debouncedSetItem = debounce(
  (name: string, value: string) => baseChromeAdapter.setItem(name, value),
  throttleMs
);

// Custom storage with throttled writes
const throttledChromeAdapter = {
  ...baseChromeAdapter,
  setItem: debouncedSetItem,
};

const chromeJSONStorage = createJSONStorage(() => throttledChromeAdapter);

const cloneDefaults = (): Settings => structuredClone(config.SETTINGS);

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: cloneDefaults(),

      saveSettings: (patch: DeepPartial<Settings>) =>
        set((state) => ({
          settings: deepMerge(state.settings, patch) as Settings,
        })),

      removeSettings: (keys: (keyof Settings)[]) =>
        set((state) => {
          const updated = structuredClone(state.settings);
          for (const key of keys) {
            delete updated[key];
          }
          return { settings: updated };
        }),

      resetSettings: () => set({ settings: cloneDefaults() }),
    }),
    {
      name: config.APP.storageBucket,

      // ✅ adapter with subscribe/onChanged
      storage: chromeJSONStorage,

      // persist only what we need
      partialize: (state) => ({ settings: state.settings }),

      // ✅ correct hydration merge order
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<SettingsStore> | undefined;

        const merged = deepMerge(cloneDefaults(), persisted?.settings ?? {});

        return {
          ...currentState,
          settings: merged,
        };
      },
    }
  )
);

// Usage examples remain the same as in your original code
/*
//! Get the current state
const currentSettings = useSettingsStore.getState().settings;

//! Call actions directly
useSettingsStore.getState().saveSettings({ theme: 'dark' });
useSettingsStore.getState().removeSettings(['watermark']);
useSettingsStore.getState().resetSettings();

//! Subscribe to changes (optional)
const unsubscribe = useSettingsStore.subscribe((state) => {
  console.log('Settings changed:', state.settings);
});

const unsubscribe = baseChromeAdapter.subscribe((updatedSettings) => {
  useSettingsStore.setState({ settings: updatedSettings });
});

useSettingsStore.persist.onFinishHydration(() => {
	useSettingsStore.subscribe(
        (s) => s.settings,
        (state) => {
          console.log('Settings changed:', state);
		  scanForMedia();
		}
    );
});

//! Later, unsubscribe
unsubscribe();
*/
