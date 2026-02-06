import React, { useRef } from 'react';
import { config } from '@/app.config';

const SIZE_MAP: Record<ComponentSize, { fontSize: string; py: string; px: string }> = {
  small: { fontSize: 'text-[10px]', py: 'py-1', px: 'px-2' },
  middle: { fontSize: 'text-[12px]', py: 'py-2', px: 'px-3' },
  large: { fontSize: 'text-[14px]', py: 'py-3', px: 'px-4' },
};

const Input: React.FC<InputProps> = ({
  label,
  size = 'middle',
  color = config.APP.color,
  soundEnabled = true,
  className = '',
  ...props
}) => {
  const audioCtx = useRef<AudioContext | null>(null);
  const { fontSize, py, px } = SIZE_MAP[size];

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

  const playFocus = () => {
    if (!soundEnabled || !audioCtx.current) return;
    const now = audioCtx.current.currentTime;
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.exponentialRampToValueAtTime(1500, now + 0.005);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.01);

    osc.connect(gain);
    gain.connect(audioCtx.current.destination);
    osc.start(now);
    osc.stop(now + 0.02);
  };

  return (
    <div className="group flex w-full flex-col items-center">
      <div className="relative w-full">
        <input
          {...props}
          className={`w-full rounded border border-white/5 bg-black font-mono font-bold text-gray-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] transition-all duration-200 outline-none placeholder:text-gray-700 focus:border-white/20 ${fontSize} ${py} ${px} ${className} `}
          onFocus={(e) => {
            initAudio();
            playFocus();
            if (props.onFocus) props.onFocus(e);
          }}
          style={{
            caretColor: color,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        />
        {/* Glow accent line when focused */}
        <div
          className="absolute bottom-0 left-1/2 h-px w-0 -translate-x-1/2 bg-current opacity-50 transition-all duration-300 group-focus-within:w-full"
          style={{ color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>

      {label && (
        <span className="text-[9px] font-semibold tracking-[0.25em] uppercase">{label}</span>
      )}
    </div>
  );
};

export default Input;
