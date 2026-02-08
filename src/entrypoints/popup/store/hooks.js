import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// Typed hooks for use in components
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

// Custom hook for checking manual changes
export const useManualChanges = () => {
  const eq = useAppSelector((state) => state.equalizer.eq);
  const selectedPreset = useAppSelector((state) => state.equalizer.selectedPreset);
  const presets = useAppSelector((state) => state.equalizer.presets);
  const isLoaded = useAppSelector((state) => state.ui.isLoaded);

  return useCallback(() => {
    if (!isLoaded || !selectedPreset || !presets.length) {
      return false;
    }
    const currentPreset = presets.find((p) => p.key === selectedPreset);
    if (!currentPreset || !currentPreset.eq) {
      return false;
    }
    // Compare current eq array with preset eq array
    return eq.some((val, index) => {
      const presetVal = currentPreset.eq[index];
      if (presetVal === undefined) return false;
      return Math.abs(val - presetVal) > 0.01; // Use small threshold for float comparison
    });
  }, [eq, selectedPreset, presets, isLoaded]);
};
