import React, { useCallback, useRef } from 'react';
import { config } from '@/app.config';

const SIZE_MAP: Record<
  ComponentSize,
  {
    px: string;
    py: string;
    fontSize: string;
    minWidth: string;
    spinnerSize: string;
    iconSize: string;
    height?: number;
  }
> = {
  small: {
    px: 'px-3',
    py: 'py-1',
    fontSize: 'text-[9px]',
    minWidth: 'min-w-[60px]',
    spinnerSize: 'w-2.5 h-2.5',
    iconSize: 'w-2.5 h-2.5',
    height: 24,
  },
  middle: {
    px: 'px-5',
    py: 'py-[6.4px]',
    fontSize: 'text-[11px]',
    minWidth: 'min-w-[100px]',
    spinnerSize: 'w-3.5 h-3.5',
    iconSize: 'w-3.5 h-3.5',
    height: 32,
  },
  large: {
    px: 'px-8',
    py: 'py-3',
    fontSize: 'text-[13px]',
    minWidth: 'min-w-[140px]',
    spinnerSize: 'w-4.5 h-4.5',
    iconSize: 'w-4.5 h-4.5',
    height: 40,
  },
};

const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  danger = false,
  loading = false,
  disabled = false,
  size = 'middle',
  label,
  icon,
  children,
  soundEnabled = true,
  color,
  className = '',
  href,
  target,
  ...props
}) => {
  const audioCtx = useRef<AudioContext | null>(null);
  const { px, py, fontSize, minWidth, spinnerSize, iconSize, height } = SIZE_MAP[size];

  // Default color logic
  const accentColor =
    color || (danger ? '#ef4444' : variant === 'primary' ? config.APP.color : config.APP.color);

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

    osc.type = 'square';
    osc.frequency.setValueAtTime(danger ? 300 : 400, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.015);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(gain);
    gain.connect(audioCtx.current.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  }, [soundEnabled, danger]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    initAudio();
    playClick();

    if (href) {
      if (target === '_blank') {
        window.open(href, '_blank');
      } else {
        window.location.href = href;
      }
    }

    if (props.onClick) props.onClick(e);
  };

  const isPrimary = variant === 'primary';
  const isText = variant === 'text';
  const isLink = variant === 'link';
  const isMinimal = isText || isLink;

  return (
    <div className="group flex flex-col items-center select-none">
      <button
        {...props}
        className={cn(
          // base
          `relative flex items-center justify-center gap-2.5 overflow-hidden font-semibold tracking-widest uppercase transition-all duration-75`,
          px,
          py,
          fontSize,

          // sizing
          // !isMinimal && minWidth,

          // shape & layout
          !isMinimal
            ? 'border-theme rounded border bg-linear-to-b from-[#444] to-[#1a1a1a]'
            : 'border-none bg-transparent p-0',

          // state
          disabled || loading
            ? 'cursor-not-allowed opacity-40'
            : 'cursor-pointer active:translate-y-px',

          // text styles
          isText && 'text-gray-500 hover:text-gray-200',
          isLink && 'text-current underline-offset-4 hover:underline',

          // danger
          danger && !isPrimary && !isMinimal && 'border-red-500/30',
          className
        )}
        disabled={disabled || loading}
        onClick={handleClick}
        style={{
          borderLeftColor: (isPrimary || danger) && !isMinimal ? accentColor : undefined,
          borderLeftWidth: (isPrimary || danger) && !isMinimal ? '3px' : undefined,
          color: isLink ? accentColor : undefined,
          height,
        }}
      >
        {/* Shine highlight (only for non-minimal buttons) */}
        {!isMinimal && (
          <div
            className="absolute inset-0 rounded-md opacity-20 blur-sm"
            style={{ backgroundColor: accentColor }}
          />
        )}

        {loading ? (
          <div
            className={`${spinnerSize} animate-spin rounded-full border-2 border-white/20 border-t-white`}
          />
        ) : (
          icon && (
            <span
              className={`${iconSize} flex items-center justify-center opacity-80 transition-opacity group-hover:opacity-100`}
              style={{ color: danger || isLink ? accentColor : undefined }}
            >
              {icon}
            </span>
          )
        )}

        <span
          className="relative z-10 text-white"
          style={{ color: danger && !isPrimary && !isLink ? accentColor : undefined }}
        >
          {label || children}
        </span>

        {/* Status LED (only for non-minimal buttons) */}
        {(isPrimary || danger) && !isMinimal && !loading && !disabled && (
          <div
            className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: accentColor,
              color: accentColor,
              boxShadow: `0 0 8px ${accentColor}`,
            }}
          />
        )}
      </button>
    </div>
  );
};

export default Button;
