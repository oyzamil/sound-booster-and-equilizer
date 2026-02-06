import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { config } from '@/app.config';

const SIZE_MAP: Record<ComponentSize, number> = {
  small: 64,
  middle: 96,
  large: 128,
};

const Knob: React.FC<KnobProps> = ({
  value,
  min,
  max,
  step = 1,
  label,
  size = 'middle',
  onChange,
  color = config.APP.color,
  trackColor = '#1a1a1a',
  unit = '',
  isBipolar = false,
  resetValue,
  soundEnabled = true,
  disabled,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const centerPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const audioCtx = useRef<AudioContext | null>(null);

  const numericSize = SIZE_MAP[size];

  // Visual constants relative to size
  const center = numericSize / 2;
  const strokeWidth = numericSize * 0.08;
  const arcRadius = numericSize / 2 - strokeWidth / 2 - 2;
  const knobBodyRadius = numericSize * 0.34;

  const startAngle = -135;
  const endAngle = 135;
  const totalAngleRange = endAngle - startAngle;

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
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.015);

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, now);

      gain.gain.setValueAtTime(dynamicGain, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.current.destination);

      osc.start(now);
      osc.stop(now + 0.025);
    },
    [soundEnabled, min, max]
  );

  const updateCenterPos = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      centerPos.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
  };

  const calculateValueFromCoords = (clientX: number, clientY: number) => {
    const dx = clientX - centerPos.current.x;
    const dy = clientY - centerPos.current.y;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;

    let normalized;
    if (angle < startAngle) {
      normalized = 0;
    } else if (angle > endAngle) {
      normalized = 1;
    } else {
      normalized = (angle - startAngle) / totalAngleRange;
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
    updateCenterPos();
    setIsDragging(true);
    document.body.classList.add('no-select');
    document.body.style.cursor = 'none';
    handleValueChange(calculateValueFromCoords(e.clientX, e.clientY));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    initAudio();
    updateCenterPos();
    setIsDragging(true);
    document.body.classList.add('no-select');
    handleValueChange(calculateValueFromCoords(e.touches[0].clientX, e.touches[0].clientY));
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    initAudio();
    const finalResetValue =
      resetValue !== undefined && isFinite(resetValue) ? resetValue : isBipolar ? 0 : min;
    handleValueChange(Math.max(min, Math.min(max, finalResetValue)));
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      handleValueChange(calculateValueFromCoords(e.clientX, e.clientY));
    },
    [isDragging, handleValueChange]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      if (e.cancelable) e.preventDefault();
      handleValueChange(calculateValueFromCoords(e.touches[0].clientX, e.touches[0].clientY));
    },
    [isDragging, handleValueChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.classList.remove('no-select');
    document.body.style.cursor = 'default';
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  const valueToAngle = useCallback(
    (val: number) => {
      const pct = (val - min) / (max - min);
      return startAngle + pct * totalAngleRange;
    },
    [min, max, totalAngleRange]
  );

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    r: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, start: number, end: number) => {
    if (Math.abs(start - end) < 0.1) return '';
    const startPoint = polarToCartesian(x, y, r, start);
    const endPoint = polarToCartesian(x, y, r, end);
    const largeArcFlag = Math.abs(end - start) <= 180 ? '0' : '1';
    const sweepFlag = end >= start ? '1' : '0';
    return [
      'M',
      startPoint.x,
      startPoint.y,
      'A',
      r,
      r,
      0,
      largeArcFlag,
      sweepFlag,
      endPoint.x,
      endPoint.y,
    ].join(' ');
  };

  const currentAngle = valueToAngle(value);
  const zeroAngle = useMemo(
    () => (isBipolar ? valueToAngle(0) : startAngle),
    [isBipolar, valueToAngle]
  );

  return (
    <div
      className={cn(
        'group flex flex-col items-center justify-center select-none',
        disabled && 'pointer-events-none'
      )}
    >
      <div
        className="relative flex cursor-pointer touch-none items-center justify-center"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClick}
        style={{ width: numericSize, height: numericSize }}
      >
        <svg
          className="pointer-events-none overflow-visible"
          width={numericSize}
          height={numericSize}
          viewBox={`0 0 ${numericSize} ${numericSize}`}
        >
          <defs>
            <radialGradient
              id={`knobGradient-${label}`}
              cx="50%"
              cy="50%"
              r="50%"
              fx="50%"
              fy="50%"
            >
              <stop offset="0%" stopColor="#3a3a3a" />
              <stop offset="100%" stopColor="#111111" />
            </radialGradient>
            <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
              <feOffset dx="0" dy="1.5" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.6" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            className="opacity-40"
            d={describeArc(center, center, arcRadius, startAngle, endAngle)}
            fill="none"
            stroke="#000"
            strokeWidth={strokeWidth + 2}
            strokeLinecap="round"
          />
          <path
            d={describeArc(center, center, arcRadius, startAngle, endAngle)}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          <path
            d={describeArc(center, center, arcRadius, zeroAngle, currentAngle)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 1.5px ${color}aa)` }}
          />

          <g filter="url(#shadow)">
            <circle
              cx={center}
              cy={center}
              r={knobBodyRadius}
              fill={`url(#knobGradient-${label})`}
              stroke="#000"
              strokeWidth="0.5"
            />
            <g
              className="transition-transform duration-75 ease-out"
              transform={`rotate(${currentAngle}, ${center}, ${center})`}
            >
              <rect
                x={center - knobBodyRadius * 0.08}
                y={center - knobBodyRadius * 0.9}
                width={knobBodyRadius * 0.16}
                height={knobBodyRadius * 0.5}
                rx={knobBodyRadius * 0.05}
                fill={color}
              />
            </g>
          </g>
        </svg>

        <div
          className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${isDragging || disabled ? 'opacity-100' : 'opacity-0'}`}
        >
          <div
            className="border-theme bg-theme-inverse text-theme-inverse rounded border px-2 text-[10px] font-bold whitespace-pre"
            style={{ transform: `translateY(-${numericSize * 0.7}px)` }}
          >
            {disabled ? 'Mono is ON' : value?.toFixed(1) + ' ' + unit}
          </div>
        </div>
      </div>

      {label && (
        <span className="text-[9px] font-semibold tracking-[0.25em] uppercase select-none">
          {label}
        </span>
      )}
    </div>
  );
};

export default Knob;
