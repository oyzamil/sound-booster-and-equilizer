import { DownOutlined } from '@ant-design/icons';
import { message as antdMessage, Collapse } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CompressorControl } from './CompressorControl';
import { ControlPanel } from './ControlPanel';
import { VolumeIcon } from './VolumeIcon';

const { Panel } = Collapse;

const App: React.FC = () => {
  const { settings: GlobalSettings, saveSettings: GlobalSaveSettings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AudioSettings | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(DEFAULT_PRESET_LABEL);

  const tabIdRef = useRef<number | null>(null);
  const settingsLoadedRef = useRef(false);
  const messageListenerRef = useRef<((message: Message) => void) | null>(null);

  // Load settings
  const loadModules = useCallback(async (moduleSettings: AudioSettings) => {
    if (settingsLoadedRef.current) {
      return;
    }

    try {
      const storageData = await getStorageData();
      const loadedSettings = moduleSettings ?? storageData.settings;

      if (!loadedSettings) {
        console.error('No settings loaded');
        setLoading(false);
        return;
      }

      setSettings(loadedSettings);
      setIsSaved(storageData.saved ?? false);
      settingsLoadedRef.current = true;
      setLoading(false);
    } catch (error) {
      console.error('Failed to load settings:', error);
      antdMessage.error('Failed to load settings');
      setLoading(false);
    }
  }, []);

  // Setup message listener
  useEffect(() => {
    const handleMessage = (message: Message) => {
      const { tabId: messageTabId, target, settings: messageSettings, type } = message;

      if (tabIdRef.current && messageTabId !== tabIdRef.current) return;
      if (target !== 'popup') return;

      if (type === 'load' && messageSettings) {
        loadModules(messageSettings);
      }
    };

    messageListenerRef.current = handleMessage;
    browser.runtime.onMessage.addListener(handleMessage);

    return () => {
      if (messageListenerRef.current) {
        browser.runtime.onMessage.removeListener(messageListenerRef.current);
      }
    };
  }, [loadModules]);

  // Initialize
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs[0];

        if (!activeTab?.id) {
          console.error('No active tab found');
          antdMessage.error('No active tab found');
          setLoading(false);
          return;
        }

        tabIdRef.current = activeTab.id;
        notifyWorkerReady(activeTab.id);
      } catch (error) {
        console.error('Failed to initialize:', error);
        antdMessage.error('Failed to initialize extension');
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Event handlers
  const handleClose = useCallback(async () => {
    if (!tabIdRef.current) return;

    try {
      const response = await powerOff(tabIdRef.current);
      if (response?.success) {
        window.close();
      }
    } catch (error) {
      console.error('Power off failed:', error);
    }
  }, []);

  const handleVolumeChange = useCallback((value: number) => {
    if (!tabIdRef.current) return;
    setVolume(tabIdRef.current, value);
    setSettings((prev) => (prev ? { ...prev, volume: value } : null));
  }, []);

  const handlePanChange = useCallback((value: number) => {
    if (!tabIdRef.current) return;
    setPan(tabIdRef.current, value);
    setSettings((prev) => (prev ? { ...prev, pan: value } : null));
  }, []);

  const handleMonoChange = useCallback(async (checked: boolean) => {
    if (!tabIdRef.current) return;
    try {
      await setMono(tabIdRef.current, checked);
      setSettings((prev) => (prev ? { ...prev, mono: checked } : null));
    } catch (error) {
      console.error('Set mono failed:', error);
    }
  }, []);

  const handleInvertChange = useCallback(async (checked: boolean) => {
    if (!tabIdRef.current) return;
    try {
      await setInvert(tabIdRef.current, checked);
      setSettings((prev) => (prev ? { ...prev, invert: checked } : null));
    } catch (error) {
      console.error('Set invert failed:', error);
    }
  }, []);

  const handleEqBandChange = useCallback((bandId: keyof EqualizerSettings, value: number) => {
    if (!tabIdRef.current) return;

    const adjustedValue = value === -20 ? value * 2 : value;
    setEqValue(tabIdRef.current, bandId, adjustedValue);

    setSettings((prev) =>
      prev
        ? {
            ...prev,
            eq: { ...prev.eq, [bandId]: value },
          }
        : null
    );
  }, []);

  const handleCompressorChange = useCallback((key: keyof CompressorSettings, value: number) => {
    if (!tabIdRef.current) return;

    setCompressorValue(tabIdRef.current, key, value);
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            compressor: { ...prev.compressor, [key]: value },
          }
        : null
    );
  }, []);

  const handlePresetChange = useCallback((presetName: string) => {
    if (!tabIdRef.current) return;

    try {
      setSelectedPreset(presetName);
      const presetSettings = convertPresetToSettings(presetName);
      loadPreset(tabIdRef.current, presetSettings);
    } catch (error) {
      console.error('Load preset failed:', error);
      antdMessage.error('Failed to load preset');
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!tabIdRef.current) return;
    saveSettings(tabIdRef.current);
    setIsSaved(true);
    antdMessage.success('Settings saved');
  }, []);

  const handleLoad = useCallback(() => {
    if (!tabIdRef.current) return;
    loadSavedSettings(tabIdRef.current);
    antdMessage.success('Settings loaded');
  }, []);

  const handleDelete = useCallback(() => {
    if (!tabIdRef.current) return;
    deleteSavedSettings(tabIdRef.current);
    setIsSaved(false);
    antdMessage.success('Settings deleted');
  }, []);

  const handleReset = useCallback(() => {
    if (!tabIdRef.current) return;
    resetSettings(tabIdRef.current);
    setSelectedPreset(DEFAULT_PRESET_LABEL);
    antdMessage.success('Settings reset');
  }, []);

  if (loading || !settings) {
    return (
      <div className="flex-col-center relative h-full">
        <Loader className="min-h-20" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* <Header version={version} onClose={handleClose} /> */}
      <Segmented
        options={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'system', label: 'System' },
        ]}
        value={GlobalSettings.theme}
        onChange={(theme) => {
          GlobalSaveSettings({ theme: theme as Theme });
        }}
        size="middle"
        block
      />
      <ControlPanel
        selectedPreset={selectedPreset}
        isSaved={isSaved}
        onPresetChange={handlePresetChange}
        onSave={handleSave}
        onLoad={handleLoad}
        onDelete={handleDelete}
        onReset={handleReset}
      />

      <div
        className={cn(
          'bg-theme border-theme flex justify-around overflow-x-hidden rounded-md border py-2'
        )}
      >
        {EQ_BANDS.map((band) => (
          <Slider
            key={band.id}
            size="small"
            orientation="vertical"
            min={MIN_EQ_VALUE}
            max={MAX_EQ_VALUE}
            step={1}
            value={settings.eq[band.id as keyof EqualizerSettings]}
            onChange={(value) => handleEqBandChange(band.id as keyof EqualizerSettings, value)}
            resetValue={DEFAULT_FADER_VALUE}
            label={band.label}
          />
        ))}
      </div>

      <Collapse
        className="bg-theme rounded-md"
        size="small"
        onChange={(keys) => {
          const isExpanded = Array.isArray(keys) ? keys.length > 0 : !!keys;

          GlobalSaveSettings({ compressorCollapsed: !isExpanded });
        }}
        activeKey={GlobalSettings.compressorCollapsed ? [] : ['compressor']}
        expandIcon={({ isActive }) => <DownOutlined rotate={isActive ? 180 : 0} />}
      >
        <Panel header="Compressor" key="compressor">
          <CompressorControl settings={settings.compressor} onChange={handleCompressorChange} />
        </Panel>
      </Collapse>

      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center rounded-md">
          <Knob
            label={
              settings.pan === 0
                ? 'C'
                : settings.pan < 0
                  ? `L${Math.abs(settings.pan)?.toFixed(1)}`
                  : `R${settings.pan?.toFixed(1)}`
            }
            value={settings.pan}
            min={-1}
            max={1}
            step={0.1}
            size="small"
            onChange={handlePanChange}
            isBipolar={true}
          />
        </div>

        <div className="w-full flex-col">
          <div className="flex w-full gap-2">
            <VolumeIcon className="" muted={settings.volume === 0} />
            <Slider
              min={0}
              max={4}
              step={0.01}
              value={settings.volume}
              onChange={handleVolumeChange}
              resetValue={DEFAULT_VOLUME}
              size="small"
              prefix={formatVolumePercent(settings.volume)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Switch
              checked={settings.mono}
              onChange={(checked) => handleMonoChange(checked)}
              label="Mono"
            />

            <Switch
              checked={settings.invert}
              onChange={(checked) => handleInvertChange(checked)}
              label="Invert"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
