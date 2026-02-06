interface EqualizerProps {
  settings: AudioSettings;
  onUpdateSettings: (settings: Partial<AudioSettings>) => void;
}

export function Equalizer({ settings, onUpdateSettings }: EqualizerProps) {
  function updateBand(index: number, gain: number) {
    const newBands = [...settings.bands];
    newBands[index] = { ...newBands[index], gain };
    onUpdateSettings({ bands: newBands });
  }

  function resetBands() {
    const resetBands = settings.bands.map((band) => ({ ...band, gain: 0 }));
    onUpdateSettings({ bands: resetBands });
  }

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="heading mb-0">Equalizer</h2>
        <Button className="" onClick={resetBands}>
          Reset
        </Button>
      </div>

      <div className="flex items-end justify-between gap-0.5">
        {settings.bands.map((band, index) => (
          <div key={index}>
            <Slider
              size="small"
              orientation="vertical"
              min={-12}
              max={12}
              step={0.5}
              value={band.gain}
              onChange={(value) => updateBand(index, value)}
              label={band.label}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
