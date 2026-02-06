import { useEffect, useState } from 'react';
import { Controls } from './Controls';
import { Equalizer } from './Equalizer';
import { PresetManager } from './Presetmanager';

export default function App() {
  const { settings, saveSettings } = useSettings();
  const [options, setOptions] = useState<AudioSettings>(DEFAULT_SETTINGS);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [currentSettings, currentPresets, activeId] = await Promise.all([
      chromeStorage.getSettings(),
      chromeStorage.getPresets(),
      chromeStorage.getActivePreset(),
    ]);

    setOptions(currentSettings);
    setPresets(currentPresets);
    setActivePresetId(activeId);
  }

  async function updateSettings(newSettings: Partial<AudioSettings>) {
    const updated = { ...options, ...newSettings };
    setOptions(updated);
    await chromeStorage.setSettings(updated);
    await sendMessage('updateSettings', updated);
  }

  async function applyPreset(preset: Preset) {
    const updated = {
      ...options,
      ...preset.settings,
    };
    setOptions(updated);
    setActivePresetId(preset.id);
    await chromeStorage.setSettings(updated);
    await chromeStorage.setActivePreset(preset.id);
    await sendMessage('updateSettings', updated);
  }

  async function saveAsPreset(name: string) {
    const newPreset: Preset = {
      id: `custom-${Date.now()}`,
      name,
      isCustom: true,
      settings: {
        volume: options.volume,
        bands: options.bands,
        stereoMode: options.stereoMode,
        invertChannels: options.invertChannels,
        balance: options.balance,
      },
    };

    await chromeStorage.addPreset(newPreset);
    await loadData();
  }

  async function deletePreset(id: string) {
    await chromeStorage.deletePreset(id);
    if (activePresetId === id) {
      setActivePresetId(null);
      await chromeStorage.setActivePreset(null);
    }
    await loadData();
  }

  async function importPreset(jsonString: string) {
    try {
      await chromeStorage.importPreset(jsonString);
      await loadData();
    } catch (error) {
      alert('Failed to import preset: ' + (error as Error).message);
    }
  }

  async function exportPreset(id: string) {
    try {
      const json = await chromeStorage.exportPreset(id);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `equalizer-preset-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export preset: ' + (error as Error).message);
    }
  }

  return (
    <>
      <div className="flex gap-1">
        <Segmented
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System' },
          ]}
          value={settings.theme}
          onChange={(theme) => {
            saveSettings({ theme: theme as Theme });
          }}
          size="middle"
          block
        />
        <Switch
          checked={options.enabled}
          onChange={(enabled) => updateSettings({ enabled })}
          label={options.enabled ? 'ON' : 'OFF'}
          orientation="horizontal"
        />
      </div>

      <div
        className={cn(
          'bg-theme border-theme flex justify-around overflow-x-hidden rounded-md border py-2'
        )}
      >
        <Equalizer settings={options} onUpdateSettings={updateSettings} />
      </div>

      <PresetManager
        presets={presets}
        activePresetId={activePresetId}
        onApplyPreset={applyPreset}
        onSavePreset={saveAsPreset}
        onDeletePreset={deletePreset}
        onImportPreset={importPreset}
        onExportPreset={exportPreset}
      />

      <Controls settings={options} onUpdateSettings={updateSettings} />
    </>
  );
}
