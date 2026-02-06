interface CompressorControlProps {
  settings: CompressorSettings;
  onChange: (key: keyof CompressorSettings, value: number) => void;
}

interface CompressorParameter {
  key: keyof CompressorSettings;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

const COMPRESSOR_PARAMS: CompressorParameter[] = [
  {
    key: 'threshold',
    label: 'THRESHOLD',
    min: -100,
    max: 0,
    step: 1,
    defaultValue: DEFAULT_FADER_VALUE,
  },
  { key: 'attack', label: 'ATTACK', min: 0, max: 1, step: 0.1, defaultValue: DEFAULT_FADER_VALUE },
  {
    key: 'release',
    label: 'RELEASE',
    min: 0.1,
    max: 1,
    step: 0.1,
    defaultValue: DEFAULT_COMPRESSOR_RELEASE,
  },
  {
    key: 'ratio',
    label: 'RATIO',
    min: 1,
    max: 20,
    step: 1,
    defaultValue: DEFAULT_COMPRESSOR_RATIO,
  },
  { key: 'knee', label: 'KNEE', min: 0, max: 40, step: 1, defaultValue: DEFAULT_COMPRESSOR_KNEE },
];

export const CompressorControl: React.FC<CompressorControlProps> = ({ settings, onChange }) => {
  const formatValue = (value: number) => {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  };

  return (
    <>
      <>
        {/* First slider - Full width */}
        {COMPRESSOR_PARAMS.slice(0, 1).map((param) => (
          <Slider
            key={param.key}
            prefix={param.label}
            size="small"
            min={param.min}
            max={param.max}
            step={param.step}
            value={settings[param.key]}
            onChange={(value) => onChange(param.key, value)}
            suffix={formatValue(settings[param.key])}
          />
        ))}

        {/* Rest of sliders - 2 columns */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {COMPRESSOR_PARAMS.slice(1).map((param) => (
            <div className="text-[10px] font-semibold" key={param.key}>
              <span>{param.label}</span>
              <Slider
                size="small"
                min={param.min}
                max={param.max}
                step={param.step}
                value={settings[param.key]}
                onChange={(value) => onChange(param.key, value)}
                suffix={formatValue(settings[param.key])}
              />
            </div>
          ))}
        </div>
      </>
    </>
  );
};
