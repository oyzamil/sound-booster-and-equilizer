export const formatVolumePercent = (volumeValue: number): string => {
  return `${Math.round(volumeValue * 100)}%`;
};

export const getSliderGradient = (value: number, min: number, max: number): string => {
  const percent = Math.ceil(((value - min) / (max - min)) * 100);
  return `linear-gradient(to right, #f59821 ${percent}%, #4b5563 ${percent}%)`;
};

export const convertPresetToSettings = (presetName: string): EqualizerSettings => {
  const presetValues = EQ_PRESETS[presetName];

  if (!presetValues) {
    throw new Error(`Unknown preset: ${presetName}`);
  }

  return {
    twenty: presetValues[0],
    fifty: presetValues[1],
    oneHundred: presetValues[2],
    twoHundred: presetValues[3],
    fiveHundred: presetValues[4],
    oneThousand: presetValues[5],
    twoThousand: presetValues[6],
    fiveThousand: presetValues[7],
    tenThousand: presetValues[8],
    twentyThousand: presetValues[9],
  };
};

export const getCurrentVersion = (): string => {
  return `V${browser.runtime.getManifest().version}`;
};
