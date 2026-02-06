const STORAGE_KEYS = {
  SETTINGS: 'audioSettings',
  PRESETS: 'audioPresets',
  ACTIVE_PRESET: 'activePreset',
} as const;

type StorageMap = {
  [STORAGE_KEYS.SETTINGS]?: AudioSettings;
  [STORAGE_KEYS.PRESETS]?: Preset[];
  [STORAGE_KEYS.ACTIVE_PRESET]?: string | null;
};

export const chromeStorage = {
  async getSettings(): Promise<AudioSettings> {
    const result = (await browser.storage.local.get(STORAGE_KEYS.SETTINGS)) as StorageMap;

    return result[STORAGE_KEYS.SETTINGS] ?? DEFAULT_SETTINGS;
  },

  async setSettings(settings: AudioSettings): Promise<void> {
    await browser.storage.local.set({
      [STORAGE_KEYS.SETTINGS]: settings,
    });
  },

  async getPresets(): Promise<Preset[]> {
    const result = (await browser.storage.local.get(STORAGE_KEYS.PRESETS)) as StorageMap;

    return result[STORAGE_KEYS.PRESETS] ?? DEFAULT_PRESETS;
  },

  async setPresets(presets: Preset[]): Promise<void> {
    await browser.storage.local.set({
      [STORAGE_KEYS.PRESETS]: presets,
    });
  },

  async addPreset(preset: Preset): Promise<void> {
    const presets = await this.getPresets();
    const updated = presets.filter((p) => p.id !== preset.id);
    await this.setPresets([...updated, preset]);
  },

  async deletePreset(id: string): Promise<void> {
    const presets = await this.getPresets();
    await this.setPresets(presets.filter((p) => p.id !== id));
  },

  async getActivePreset(): Promise<string | null> {
    const result = (await browser.storage.local.get(STORAGE_KEYS.ACTIVE_PRESET)) as StorageMap;

    return result[STORAGE_KEYS.ACTIVE_PRESET] ?? null;
  },

  async setActivePreset(id: string | null): Promise<void> {
    await browser.storage.local.set({
      [STORAGE_KEYS.ACTIVE_PRESET]: id,
    });
  },

  async exportPreset(id: string): Promise<string> {
    const presets = await this.getPresets();
    const preset = presets.find((p) => p.id === id);

    if (!preset) {
      throw new Error('Preset not found');
    }

    return JSON.stringify(preset, null, 2);
  },

  async importPreset(jsonString: string): Promise<Preset> {
    const parsed = JSON.parse(jsonString) as Partial<Preset>;

    if (!parsed.name || !parsed.settings) {
      throw new Error('Invalid preset format');
    }

    const preset: Preset = {
      ...parsed,
      id: `custom-${Date.now()}`,
      isCustom: true,
    } as Preset;

    await this.addPreset(preset);
    return preset;
  },
};
