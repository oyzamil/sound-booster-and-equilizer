import React, { useCallback, useEffect, useRef, useState } from 'react';
import { config } from '@/app.config';

const VERTICAL_SIZE_MAP: Record<ComponentSize, { h: number; w: number; cap: number }> = {
  small: { h: 120, w: 32, cap: 20 },
  middle: { h: 180, w: 42, cap: 30 },
  large: { h: 260, w: 52, cap: 38 },
};

const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step = 1,
  label,
  size = 'middle',
  thumbSize = 'small',
  orientation = 'horizontal',
  suffix,
  prefix,
  onChange,
  color = config.APP.color,
  unit = '',
  resetValue,
  soundEnabled = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const audioCtx = useRef<AudioContext | null>(null);

  const { h, w } = VERTICAL_SIZE_MAP[size];

  // Resolve thumb size dimension
  let resolvedCapDim: number;
  if (typeof thumbSize === 'number') {
    resolvedCapDim = thumbSize;
  } else {
    resolvedCapDim = VERTICAL_SIZE_MAP[thumbSize].cap;
  }

  const isVertical = orientation === 'vertical';

  // Base dimensions
  const trackWidth = isVertical ? w : '100%';
  const trackHeight = isVertical ? h : w;
  const capWidth = isVertical ? w * 0.7 : resolvedCapDim;
  const capHeight = isVertical ? resolvedCapDim : w * 0.7;

  const initAudio = () => {
    if (!soundEnabled) return;
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 44100,
      });
    }
    if (audioCtx.current.state === 'suspended') {
      audioCtx.current.resume();
    }
  };

  const playTick = useCallback(
    (currentVal: number) => {
      if (!soundEnabled || !audioCtx.current) return;

      const now = audioCtx.current.currentTime;

      // Map value range to gain range [0.01 - 0.08]
      const normalized = (currentVal - min) / (max - min);
      const dynamicGain = 0.01 + normalized * 0.07;

      const osc = audioCtx.current.createOscillator();
      const gain = audioCtx.current.createGain();
      const filter = audioCtx.current.createBiquadFilter();

      osc.type = 'square';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.012);

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, now);

      gain.gain.setValueAtTime(dynamicGain, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.current.destination);

      osc.start(now);
      osc.stop(now + 0.02);
    },
    [soundEnabled, min, max]
  );

  const calculateValueFromCoords = (clientX: number, clientY: number) => {
    if (!trackRef.current) return value;
    const rect = trackRef.current.getBoundingClientRect();

    let normalized = 0;
    if (isVertical) {
      const halfCap = capHeight / 2;
      const relativeY = Math.max(halfCap, Math.min(rect.height - halfCap, clientY - rect.top));
      normalized = 1 - (relativeY - halfCap) / (rect.height - capHeight);
    } else {
      const halfCap = capWidth / 2;
      const relativeX = Math.max(halfCap, Math.min(rect.width - halfCap, clientX - rect.left));
      normalized = (relativeX - halfCap) / (rect.width - capWidth);
    }

    const range = max - min;
    let newValue = min + normalized * range;
    newValue = Math.round(newValue / step) * step;
    newValue = Math.max(min, Math.min(max, newValue));

    return newValue;
  };

  const handleValueChange = useCallback(
    (newValue: number) => {
      if (newValue !== value) {
        onChange(newValue);
        playTick(newValue);
      }
    },
    [value, onChange, playTick]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    initAudio();
    setIsDragging(true);
    document.body.classList.add('no-select');
    handleValueChange(calculateValueFromCoords(e.clientX, e.clientY));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    initAudio();
    setIsDragging(true);
    handleValueChange(calculateValueFromCoords(e.touches[0].clientX, e.touches[0].clientY));
  };

  const handleDoubleClick = () => {
    initAudio();
    const finalResetValue = resetValue !== undefined ? resetValue : min;
    handleValueChange(finalResetValue);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) handleValueChange(calculateValueFromCoords(e.clientX, e.clientY));
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        if (e.cancelable) e.preventDefault();
        handleValueChange(calculateValueFromCoords(e.touches[0].clientX, e.touches[0].clientY));
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.classList.remove('no-select');
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleValueChange, isVertical]);

  const normalized = (value - min) / (max - min);
  const percent = normalized * 100;

  // Logic for precise thumb centering within visual track bounds
  const capPosStyle: React.CSSProperties = isVertical
    ? {
        bottom: `${percent}%`,
        transform: `translateY(${percent}%)`,
      }
    : {
        left: `${percent}%`,
        transform: `translateX(-${percent}%)`,
      };

  // Improved Fill Calculation to perfectly meet the cap's visual center
  const fillStyle: React.CSSProperties = isVertical
    ? {
        width: '2px',
        height: `calc(${capHeight / 2}px + ${normalized} * (100% - ${capHeight}px))`,
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: color,
        boxShadow: `0 0 10px ${color}aa`,
        zIndex: 1,
      }
    : {
        height: '2px',
        width: `calc(${capWidth / 2}px + ${normalized} * (100% - ${capWidth}px))`,
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        backgroundColor: color,
        boxShadow: `0 0 10px ${color}aa`,
        zIndex: 1,
      };

  return (
    <div
      className={`group flex items-center select-none ${isVertical ? 'flex-col' : 'w-full flex-row gap-2'}`}
    >
      {prefix && (
        <span
          className={`${isVertical ? 'mb-2' : ''} font-semibold tracking-[0.25em] whitespace-nowrap uppercase`}
        >
          {prefix}
        </span>
      )}

      <div
        className="relative flex cursor-pointer touch-none items-center justify-center"
        ref={trackRef}
        style={{ height: trackHeight, width: trackWidth }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClick}
      >
        {/* The Track Slot (Recessed Well) - Now Centered correctly */}
        <div
          className="border-theme shadow-inset-theme bg-theme rounded-full border"
          style={{
            width: isVertical ? '20%' : '100%',
            height: isVertical ? '100%' : '20%',
            position: 'absolute',
            top: isVertical ? 0 : '50%',
            left: isVertical ? '50%' : 0,
            transform: isVertical ? 'translateX(-50%)' : 'translateY(-50%)',
          }}
        />

        {/* Active Fill Line */}
        <div
          className="pointer-events-none absolute rounded-full transition-all duration-75"
          style={fillStyle}
        />

        {/* Fader Cap */}
        <div
          className="absolute flex items-center justify-center transition-transform duration-75"
          style={{
            ...capPosStyle,
            width: capWidth,
            height: capHeight,
            zIndex: 10,
          }}
        >
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded border border-white/10 bg-linear-to-b from-[#444] via-[#222] to-[#111] hover:shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
            <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-white/5 via-transparent to-black/20" />
            {/* Center Accent Marker */}
            <div
              className="bg-current"
              style={{
                color,
                width: isVertical ? '100%' : '2px',
                height: isVertical ? '2px' : '100%',
                boxShadow: `0 0 4px ${color}`,
              }}
            />
          </div>

          <div
            className={`absolute ${isVertical ? '-right-16' : '-top-10'} border-theme text-theme-inverse bg-theme-inverse rounded border px-2 py-0.5 text-[10px] transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0'} z-50 whitespace-nowrap`}
          >
            {value.toFixed(1)}
            {unit}
          </div>
        </div>
      </div>

      {(label || suffix) && (
        <span
          className={`${isVertical ? 'mt-2' : ''} font-semibold tracking-[0.25em] whitespace-nowrap uppercase`}
        >
          {label || suffix}
        </span>
      )}
    </div>
  );
};

export default Slider;
