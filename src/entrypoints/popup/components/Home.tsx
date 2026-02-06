import { Controls } from './Controls';
import { Equalizer } from './Equalizer';
import { PresetManager } from './Presetmanager';

export default function App() {
  const { settings, saveSettings } = useSettings();

  // ----------------------------
  // Update settings
  // ----------------------------
  function updateSettings(patch: Partial<AudioSettings>) {
    saveSettings({
      ...settings,
      ...patch,
    });
  }

  // ----------------------------
  // Apply a preset by ID
  // ----------------------------
  function applyPreset(preset: Preset) {
    saveSettings({
      ...settings,
      ...preset.settings,
      activePresetId: preset.id, // cast fixes TS type
    });
  }

  // ----------------------------
  // Save current settings as a new preset
  // ----------------------------
  function saveAsPreset(name: string) {
    const newPreset: Preset = {
      id: `custom-${Date.now()}`,
      name, // guaranteed string
      isCustom: true,
      settings: {
        volume: settings.volume,
        bands: settings.bands,
        stereoMode: settings.stereoMode,
        invertChannels: settings.invertChannels,
        balance: settings.balance,
      },
    };

    saveSettings({
      ...settings,
      presets: [...settings.presets, newPreset],
    });
  }

  // ----------------------------
  // Delete a preset
  // ----------------------------
  function deletePreset(id: string) {
    saveSettings({
      ...settings,
      presets: settings.presets.filter((p) => p.id !== id),
      activePresetId: settings.activePresetId === id ? null : settings.activePresetId,
    });
  }

  // ----------------------------
  // Import a preset from JSON string
  // ----------------------------
  function importPreset(jsonString: string) {
    try {
      const parsed = JSON.parse(jsonString) as Preset;

      if (!parsed.name || !parsed.settings) {
        throw new Error('Invalid preset format');
      }

      const preset: Preset = {
        ...parsed,
        id: `custom-${Date.now()}`,
        isCustom: true,
        name: parsed.name,
        settings: parsed.settings,
      };

      saveSettings({
        ...settings,
        presets: [...settings.presets, preset],
      });
    } catch (error) {
      alert('Failed to import preset: ' + (error as Error).message);
    }
  }

  // ----------------------------
  // Export a preset as JSON
  // ----------------------------
  function exportPreset(id: string) {
    try {
      const preset = settings.presets.find((p) => p.id === id);
      if (!preset) throw new Error('Preset not found');

      const json = JSON.stringify(preset, null, 2);
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
          checked={settings.enabled}
          onChange={(enabled) => updateSettings({ enabled })}
          label={settings.enabled ? 'ON' : 'OFF'}
          orientation="horizontal"
        />
      </div>

      <div
        className={cn(
          'bg-theme border-theme flex justify-around overflow-x-hidden rounded-md border py-2'
        )}
      >
        <Equalizer settings={settings} onUpdateSettings={updateSettings} />
      </div>

      <PresetManager
        presets={settings.presets}
        activePresetId={settings.activePresetId}
        onApplyPreset={applyPreset}
        onSavePreset={saveAsPreset}
        onDeletePreset={deletePreset}
        onImportPreset={importPreset}
        onExportPreset={exportPreset}
      />

      <Controls settings={settings} onUpdateSettings={updateSettings} />
    </>
  );
}
