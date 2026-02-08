import { useState } from 'react';
import { Logo } from '@/components/Watermark';
import { BinIcon } from '@/icons';
import { RefreshCw } from 'lucide-react';
import Header from './components/Header';
import PresetNameModal from './components/PresetNameModal';
import ReviewModal from './components/ReviewModal';
import { VolumeIcon } from './components/VolumeIcon';
import { useAppDispatch, useAppSelector } from './store/hooks';
import {
  addPreset,
  deletePreset,
  resetEqualizer,
  setBalance,
  setHasManualChanges,
  setInvert,
  setMono,
  setSelectedPreset,
  setVolume,
  updateEqValue,
  updatePreset,
} from './store/slices/equalizerSlice';
import { toggleEnable } from './store/thunks/audioThunks';

const Eq = () => {
  const { settings, saveSettings } = useSettings();
  const dispatch = useAppDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Selectors
  const isLoaded = useAppSelector((state) => state.ui.isLoaded);
  const isLoading = useAppSelector((state) => state.ui.isLoading);
  const isEnable = useAppSelector((state) => state.ui.isEnable);
  const current = useAppSelector((state) => state.ui.current);
  const selectedPreset = useAppSelector((state) => state.equalizer.selectedPreset);
  const presets = useAppSelector((state) => state.equalizer.presets);
  const eq = useAppSelector((state) => state.equalizer.eq);
  const volume = useAppSelector((state) => state.equalizer.volume);
  const balance = useAppSelector((state) => state.equalizer.balance);
  const isMono = useAppSelector((state) => state.equalizer.isMono);
  const isInvert = useAppSelector((state) => state.equalizer.isInvert);
  const hasManualChanges = useAppSelector((state) => state.equalizer.hasManualChanges);

  const handleResetEqualizer = () => {
    dispatch(resetEqualizer());
  };

  // Function to save new preset
  const handleSaveAs = () => {
    if (!hasManualChanges) return;
    setIsModalOpen(true);
  };

  const handlePresetNameConfirm = async (presetName) => {
    if (!presetName || presetName.trim() === '') {
      return;
    }

    const newKey = `custom_${Date.now()}`;
    const newPreset = {
      key: newKey,
      name: presetName.trim(),
      eq: [...eq],
      isCustom: true,
    };

    dispatch(addPreset(newPreset));
    dispatch(setSelectedPreset(newKey));
    dispatch(setHasManualChanges(false));
    setIsModalOpen(false);

    // Track preset creation count and show review modal after 1st and 4th creation
    try {
      const result = await browser.storage.local.get(['customPresetsCount']);
      const currentCount = result.customPresetsCount || 0;
      const newCount = currentCount + 1;

      await browser.storage.local.set({ customPresetsCount: newCount });

      // Show review modal after 1st and 4th preset creation
      if (newCount === 1 || newCount === 4) {
        setIsReviewModalOpen(true);
      }
    } catch (error) {
      console.error('Error tracking preset count:', error);
    }

    // Note: customPresets are automatically saved by chromeStorageMiddleware when addPreset action is dispatched
  };

  // Function to save changes to existing custom preset
  const handleSave = () => {
    if (!hasManualChanges) return;

    const currentPreset = presets.find((p) => p.key === selectedPreset);
    if (!currentPreset || !currentPreset.isCustom) return;

    dispatch(updatePreset({ key: selectedPreset, eq: [...eq] }));
    dispatch(setHasManualChanges(false));
    // Note: customPresets are automatically saved by chromeStorageMiddleware when updatePreset action is dispatched
  };

  // Function to delete custom preset
  const handleDeletePreset = () => {
    const currentPreset = presets.find((p) => p.key === selectedPreset);
    if (!currentPreset || !currentPreset.isCustom) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete preset "${currentPreset.name}"?`
    );
    if (!confirmed) return;

    dispatch(deletePreset(selectedPreset));
    dispatch(setHasManualChanges(false));
    // Note: customPresets are automatically saved by chromeStorageMiddleware when deletePreset action is dispatched
  };

  // Helper function to check if current preset is custom
  const isCurrentPresetCustom = () => {
    const currentPreset = presets.find((p) => p.key === selectedPreset);
    return currentPreset && currentPreset.isCustom === true;
  };

  /*


  align-content: space-around;
  justify-content: flex-start;
  align-items: stretch;
     */
  return (
    <>
      <PresetNameModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handlePresetNameConfirm}
      />
      <ReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} />

      {isLoading && <Loader />}
      {isLoaded && !isLoading && (
        <>
          <Header />
          <div className="p-2">
            <div className="grid grid-cols-[1fr_1fr_auto] grid-rows-2 gap-1">
              <div className="col-span-2 row-span-1">
                <Segmented
                  options={[
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                    { value: 'system', label: 'System' },
                  ]}
                  value={settings.theme}
                  onChange={(theme) => {
                    saveSettings({ theme: theme });
                  }}
                  block
                />
              </div>

              <div className="col-span-2 row-span-1 row-start-2 flex gap-1 capitalize">
                <Select
                  onChange={(preset) => {
                    if (isLoaded) {
                      dispatch(setSelectedPreset(preset));
                    }
                  }}
                  value={selectedPreset}
                  disabled={current !== 'equalizer' || !isEnable}
                  options={presets.map((preset) => ({
                    value: preset.key,
                    label: preset.isCustom ? `★ ${preset.name}` : preset.name,
                  }))}
                />
                <Button className={'w-7'} title="Reset All" onClick={handleResetEqualizer}>
                  <RefreshCw className="size-4" />
                </Button>

                {hasManualChanges && !isCurrentPresetCustom() && (
                  <Button className={'w-24'} onClick={handleSaveAs}>
                    Save as
                  </Button>
                )}
                {hasManualChanges && isCurrentPresetCustom() && (
                  <Button className={'w-15'} onClick={handleSave}>
                    Save
                  </Button>
                )}
                {isCurrentPresetCustom() && (
                  <Button className={'w-7'} title="Delete Preset" onClick={handleDeletePreset}>
                    <BinIcon />
                  </Button>
                )}
              </div>

              <div className="col-start-3 row-span-2">
                {/* <Button onClick={() => setIsReviewModalOpen(true)} title="Leave a review">
                  <StarIcon className="size-4 fill-yellow-400 text-yellow-400" />
                </Button> */}

                <Button
                  className="flex h-full! w-full rounded-md"
                  onClick={() => {
                    dispatch(toggleEnable());
                  }}
                >
                  <Logo
                    className="block w-10 rounded-lg"
                    rootClassName={cn(
                      'w-full h-full relative py-[13px] bg-transparent dark:bg-transparent',
                      !isEnable && 'grayscale'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute -top-1.5 -right-4 text-[10px]',
                        isEnable ? 'text-white' : 'text-gray-300'
                      )}
                    >
                      {isEnable ? 'Off' : 'On'}
                    </span>
                  </Logo>
                </Button>
              </div>
            </div>

            {isEnable ? (
              <>
                {/* Equalizers List */}
                <div className="border-theme bg-theme flex justify-around rounded-md border p-2 text-[10px]">
                  {eq.map((val, index) => {
                    const names = [32, 64, 125, 250, 500, '1k', '2k', '4k', '8k', '16k'];
                    return (
                      <Slider
                        min={-40}
                        max={40}
                        step={0.5}
                        value={val}
                        name={32 * index}
                        index={index}
                        key={`eq-${index}-${selectedPreset}`}
                        label={names[index]}
                        orientation="vertical"
                        onChange={(value) => {
                          dispatch(updateEqValue({ index, value }));
                        }}
                        size="small"
                        thumbSize="small"
                        disabled={!isEnable}
                      />
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className={'disabled flex-center h-50'}>
                  <div>Audio Equalizer is currently switched off!</div>
                </div>
              </>
            )}
            {current === 'equalizer' && isEnable && (
              <>
                <div className="mt-1 grid grid-cols-[auto_1fr_1fr] grid-rows-2 gap-x-2">
                  <div className="col-start-1 row-span-2 row-start-1">
                    <Knob
                      label={
                        balance === 0
                          ? 'C'
                          : balance < 0
                            ? `L${Math.abs(balance * 100).toFixed(0)}`
                            : `R${(balance * 100).toFixed(0)}`
                      }
                      value={balance}
                      min={-1}
                      max={1}
                      step={0.1}
                      onChange={(balance) => {
                        dispatch(setBalance(balance));
                      }}
                      isBipolar={true}
                      size="small"
                      // disabled={settings.stereoMode === 'mono'}
                    />
                  </div>
                  <div className="flex-center col-span-2 col-start-2 row-start-1 w-full gap-2 text-[8px]">
                    <Slider
                      min={0}
                      max={4}
                      step={0.2}
                      value={volume}
                      name="Volume"
                      key={'volume'}
                      isEnable={isEnable}
                      onChange={(value) => {
                        dispatch(setVolume(value));
                      }}
                      resetValue={1}
                      size="small"
                      prefix={<VolumeIcon className="size-6" muted={volume === 0} />}
                      suffix={(volume * 100).toFixed(0) + '%'}
                    />
                  </div>
                  <div className="col-span-2 col-start-2 row-start-2 -mt-1.5 flex justify-end gap-2">
                    <Switch
                      checked={isMono}
                      onChange={(mono) => {
                        dispatch(setMono(mono));
                      }}
                      label="Mono"
                    />

                    <Switch
                      checked={isInvert}
                      onChange={(invert) => {
                        dispatch(setInvert(invert));
                      }}
                      label="Invert"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default Eq;
