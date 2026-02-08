import React, { useCallback, useEffect, useRef, useState } from 'react';
import { config } from '@/app.config';

const SIZE_MAP: Record<
  ComponentSize,
  { height: string; fontSize: string; py: string; px: string; iconSize: string }
> = {
  small: {
    height: '28px',
    fontSize: 'text-[9px]',
    py: 'py-1',
    px: 'px-3',
    iconSize: 'w-2.5 h-2.5',
  },
  middle: {
    height: '36px',
    fontSize: 'text-[11px]',
    py: 'py-1.5',
    px: 'px-5',
    iconSize: 'w-3.5 h-3.5',
  },
  large: {
    height: '44px',
    fontSize: 'text-[13px]',
    py: 'py-2',
    px: 'px-7',
    iconSize: 'w-4.5 h-4.5',
  },
};

const Segmented: React.FC<SegmentedProps> = ({
  options,
  value,
  onChange,
  label,
  size = 'middle',
  color = config.APP.color,
  block = false,
  soundEnabled = true,
}) => {
  const audioCtx = useRef<AudioContext | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});

  const { height, fontSize, iconSize } = SIZE_MAP[size];

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

  const playClick = useCallback(() => {
    if (!soundEnabled || !audioCtx.current) return;
    const now = audioCtx.current.currentTime;
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.01);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    osc.connect(gain);
    gain.connect(audioCtx.current.destination);
    osc.start(now);
    osc.stop(now + 0.02);
  }, [soundEnabled]);

  const updateIndicator = useCallback(() => {
    if (!containerRef.current) return;
    const activeElement = containerRef.current.querySelector(
      `[data-value="${value}"]`
    ) as HTMLElement;
    if (activeElement) {
      setIndicatorStyle({
        width: activeElement.offsetWidth - 4,
        height: activeElement.offsetHeight - 4,
        transform: `translateX(${activeElement.offsetLeft + 2}px) translateY(${activeElement.offsetTop + 2}px)`,
      });
    }
  }, [value]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  const handleSelect = (val: string, disabled?: boolean) => {
    if (disabled || val === value) return;
    initAudio();
    playClick();
    onChange(val);
  };

  return (
    <div className={`group flex flex-col items-center select-none ${block ? 'w-full' : ''}`}>
      <div
        className={`border-theme bg-theme shadow-inset-theme relative flex items-center overflow-hidden rounded-md border p-1 ${block ? 'w-full' : ''}`}
        ref={containerRef}
        style={{ height }}
      >
        {/* Sliding Indicator Block */}
        <div
          className="pointer-events-none absolute top-0 left-0 overflow-hidden rounded border border-white/10 bg-linear-to-b from-[#444] to-[#1a1a1a] shadow-md transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{
            ...indicatorStyle,
          }}
        >
          {/* Backlit Glow */}
          <div
            className="absolute inset-0 rounded-md opacity-20 blur-sm"
            style={{ backgroundColor: color }}
          />
        </div>

        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <button
              className={`relative z-10 flex h-full flex-1 items-center justify-center gap-2 px-4 font-black tracking-widest uppercase transition-colors duration-300 ${fontSize} ${isActive ? 'text-white' : 'text-theme'} ${option.disabled ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'} `}
              key={option.value}
              data-value={option.value}
              onClick={() => handleSelect(option.value, option.disabled)}
              disabled={option.disabled}
              style={{
                color: isActive ? 'white' : undefined,
                textShadow: isActive ? `0 0 10px ${color}88` : 'none',
              }}
            >
              {option.icon && <span className={iconSize}>{option.icon}</span>}
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      {label && (
        <span className="mt-3 text-[9px] font-black tracking-[0.25em] text-gray-500 uppercase transition-colors group-hover:text-white">
          {label}
        </span>
      )}
    </div>
  );
};

export default Segmented;

// const MODE_OPTIONS: SegmentedOption[] = [
//   { value: 'mono', label: 'MONO' },
//   { value: 'poly', label: 'POLY' },
//   { value: 'unison', label: 'UNISON' },
// ];

// const VIEW_OPTIONS: SegmentedOption[] = [
//   { value: 'main', label: 'MAIN' },
//   { value: 'edit', label: 'EDIT' },
//   { value: 'matrix', label: 'MATRIX' },
// ];

// <Segmented
// options={VIEW_OPTIONS}
// value={viewMode}
// onChange={setViewMode}
// size="small"
// color="#3b82f6"
//               />

//               <Segmented
// options={MODE_OPTIONS}
// value={voiceMode}
// onChange={setVoiceMode}
// size="middle"
// color="#10b981"
// block
//   />
