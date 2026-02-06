import { VolumeIcon } from './VolumeIcon';

interface ControlsProps {
  settings: AudioSettings;
  onUpdateSettings: (settings: Partial<AudioSettings>) => void;
}

export function Controls({ settings, onUpdateSettings }: ControlsProps) {
  return (
    <>
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center rounded-md">
          <Knob
            label={
              settings.balance === 0
                ? 'C'
                : settings.balance < 0
                  ? `L${Math.abs(settings.balance * 100).toFixed(0)}`
                  : `R${(settings.balance * 100).toFixed(0)}`
            }
            value={settings.balance}
            min={-1}
            max={1}
            step={0.1}
            size="small"
            onChange={(balance) => onUpdateSettings({ balance })}
            isBipolar={true}
            disabled={settings.stereoMode === 'mono'}
          />
        </div>

        <div className="w-full flex-col">
          <div className="flex-center w-full gap-2 text-[8px]">
            <VolumeIcon className="size-6" muted={settings.volume === 0} />
            <Slider
              min={0}
              max={10}
              step={0.01}
              value={settings.volume}
              onChange={(volume) => onUpdateSettings({ volume })}
              resetValue={DEFAULT_SETTINGS.volume}
              size="small"
              prefix={(settings.volume * 100).toFixed(0) + '%'}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Switch
              checked={settings.stereoMode === 'mono'}
              onChange={() => {
                if (settings.stereoMode === 'mono') onUpdateSettings({ stereoMode: 'stereo' });
                else onUpdateSettings({ stereoMode: 'mono', balance: 0 });
              }}
              label="Mono"
            />

            <Switch
              checked={settings.invertChannels}
              onChange={() => onUpdateSettings({ invertChannels: !settings.invertChannels })}
              label="Invert"
            />
          </div>
        </div>
      </div>
    </>
  );
}
