import React, { useCallback, useRef } from 'react';
import { config } from '@/app.config';

const SIZE_MAP: Record<
  ComponentSize,
  { width: number; height: number; thumb: number; gap: number }
> = {
  small: { width: 36, height: 20, thumb: 14, gap: 3 },
  middle: { width: 52, height: 28, thumb: 20, gap: 4 },
  large: { width: 72, height: 38, thumb: 28, gap: 5 },
};

const Switch: React.FC<SwitchProps> = ({
  orientation = 'vertical',
  checked,
  onChange,
  label,
  size = 'middle',
  color = config.APP.color,
  soundEnabled = true,
}) => {
  const audioCtx = useRef<AudioContext | null>(null);
  const { width, height, thumb, gap } = SIZE_MAP[size];

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

  const playSnap = useCallback(
    (isOn: boolean) => {
      if (!soundEnabled || !audioCtx.current) return;

      const now = audioCtx.current.currentTime;
      const osc = audioCtx.current.createOscillator();
      const gain = audioCtx.current.createGain();
      const filter = audioCtx.current.createBiquadFilter();

      // ON sound is crisp and high, OFF is a bit deeper/thuddier
      const freq = isOn ? 1800 : 900;
      const decay = isOn ? 0.02 : 0.03;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + decay);

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(isOn ? 1500 : 800, now);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.current.destination);

      osc.start(now);
      osc.stop(now + decay + 0.01);
    },
    [soundEnabled]
  );

  const handleToggle = () => {
    initAudio();
    const nextValue = !checked;
    onChange(nextValue);
    playSnap(nextValue);
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-2 select-none',
        orientation === 'vertical' && 'flex-col'
      )}
    >
      <div
        className="relative cursor-pointer transition-all duration-200"
        onClick={handleToggle}
        role="switch"
        aria-checked={checked}
        style={{ width, height }}
      >
        {/* Recessed Track Well */}
        <div
          className="border-theme bg-theme shadow-inset-theme absolute inset-0 rounded-full border"
        />

        {/* LED Indicator Background Glow */}
        <div
          className="absolute top-1/2 right-0 h-4 w-4 -translate-y-1/2 rounded-full blur-md transition-opacity duration-300"
          style={{
            backgroundColor: color,
            opacity: checked ? 0.3 : 0,
            right: gap * 2,
          }}
        />

        {/* The Sliding Actuator */}
        <div
          className="border-app-500/10 shadow-inset-theme absolute top-1/2 flex -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border bg-linear-to-b from-[#444] via-[#222] to-[#111] transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{
            width: thumb,
            height: thumb,
            left: checked ? width - thumb - gap : gap,
          }}
        >
          {/* Actuator Top Highlight */}
          <div
            className="absolute inset-0 rounded-md opacity-60 blur-sm"
            style={{ backgroundColor: color }}
          />

          {/* Integrated Status LED Jewel */}
          <div
            className="rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all duration-300"
            style={{
              width: thumb * 0.4,
              height: thumb * 0.4,
              backgroundColor: checked ? color : '#1a1a1a',
              boxShadow: checked ? `0 0 8px ${color}, inset 0 0 2px rgba(255,255,255,0.5)` : 'none',
            }}
          />
        </div>
      </div>

      {label && (
        <span className="text-[9px] font-semibold tracking-[0.25em] uppercase">{label}</span>
      )}
    </div>
  );
};

export default Switch;

{
  /* <Switch label="Mute" checked={mute} onChange={setMute} size="middle" color="#facc15" />
<Switch label="Solo" checked={solo} onChange={setSolo} size="middle" color="#3b82f6" /> */
}
