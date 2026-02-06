import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { config } from '@/app.config';

const SIZE_MAP: Record<
  ComponentSize,
  { width: number; height: number; fontSize: string; padding: string }
> = {
  small: { width: 100, height: 24, fontSize: '10px', padding: 'px-2' },
  middle: { width: 140, height: 32, fontSize: '12px', padding: 'px-3' },
  large: { width: 180, height: 40, fontSize: '14px', padding: 'px-4' },
};

const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder,
  size = 'middle',
  color = config.APP.color,
  search = false,
  keyboardNavigation = true,
  soundEnabled = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const audioCtx = useRef<AudioContext | null>(null);

  const { width, height, fontSize, padding } = SIZE_MAP[size];

  // Show options sorted alphabetically by label
  const processedOptions = useMemo(() => {
    let result = [...options];
    if (search && searchTerm) {
      result = result.filter((opt) => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return result.sort((a, b) => a.label.localeCompare(b.label));
  }, [options, search, searchTerm]);

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
    (isAction: boolean = false) => {
      if (!soundEnabled || !audioCtx.current) return;
      const now = audioCtx.current.currentTime;
      const osc = audioCtx.current.createOscillator();
      const gain = audioCtx.current.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isAction ? 800 : 1400, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.01);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

      osc.connect(gain);
      gain.connect(audioCtx.current.destination);
      osc.start(now);
      osc.stop(now + 0.02);
    },
    [soundEnabled]
  );

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
    playTick(true);
  };

  const currentIndex = processedOptions.findIndex((opt) => opt.value === value);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!keyboardNavigation) return;
    initAudio();

    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = (currentIndex + 1) % processedOptions.length;
        onChange(processedOptions[next].value);
        playTick();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = (currentIndex - 1 + processedOptions.length) % processedOptions.length;
        onChange(processedOptions[prev].value);
        playTick();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        playTick(true);
      }
      return;
    }

    // Open state navigation
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % processedOptions.length);
        playTick();
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + processedOptions.length) % processedOptions.length);
        playTick();
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < processedOptions.length) {
          handleSelect(processedOptions[focusedIndex].value);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        playTick(true);
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // When opening, specifically target the current value for focus and auto-scroll
  useEffect(() => {
    if (isOpen) {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
      const idx = processedOptions.findIndex((o) => o.value === value);
      setFocusedIndex(idx >= 0 ? idx : 0);

      // Auto-scroll to selected option
      if (idx >= 0) {
        requestAnimationFrame(() => {
          const listElement = listRef.current;
          const selectedElement = listElement?.querySelector(`[data-value="${value}"]`);
          if (selectedElement) {
            selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        });
      }
    }
  }, [isOpen, value, processedOptions]);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder || 'SELECT...';
  const isPlaceholder = !selectedOption;

  return (
    <div className="group flex w-full flex-col items-center select-none" ref={containerRef}>
      <div
        className="relative w-full outline-none"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onClick={() => {
          initAudio();
          setIsOpen(!isOpen);
          playTick(true);
        }}
        style={{ minWidth: width }}
      >
        {/* Main Well */}
        <div
          className={`border-theme bg-theme shadow-inset-theme flex items-center justify-between rounded border transition-colors duration-200 ${padding} ${isOpen ? 'border-white/20' : 'group-hover:border-white/10'}`}
          style={{ height }}
        >
          <span
            className={`pointer-events-none truncate font-mono font-semibold transition-colors ${isPlaceholder && !isOpen ? 'text-gray-600' : 'text-theme'}`}
            style={{
              fontSize,
              textShadow: !isPlaceholder && !isOpen ? `0 0 5px ${color}33` : 'none',
            }}
          >
            {displayLabel}
          </span>
          <svg
            className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            style={{ color: isOpen ? color : '#444' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className="animate-in fade-in zoom-in-95 absolute z-100 mt-2 w-full overflow-hidden rounded-md border border-white/10 bg-[#1a1a1a] shadow-[0_20px_40px_rgba(0,0,0,0.9)] backdrop-blur-md duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            {search && (
              <div className="border-b border-white/5 p-2">
                <input
                  className="w-full border-b border-white/10 bg-black/50 px-2 py-1 font-mono text-[10px] text-white transition-colors outline-none focus:border-current"
                  ref={searchInputRef}
                  type="text"
                  placeholder="SEARCH..."
                  style={{ color }}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setFocusedIndex(0);
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            )}

            <div className="custom-scrollbar max-h-50 overflow-y-auto" ref={listRef}>
              {processedOptions.length > 0 ? (
                processedOptions.map((opt, idx) => {
                  const isSelected = opt.value === value;
                  const isFocused = idx === focusedIndex;
                  return (
                    <div
                      className={`relative flex cursor-pointer items-center gap-3 px-3 py-2 font-mono text-[11px] font-bold transition-all ${isFocused ? 'bg-white/5' : ''} `}
                      key={opt.value}
                      data-value={opt.value}
                      style={{
                        borderLeft: isFocused ? `2px solid ${color}` : '2px solid transparent',
                        color: isSelected ? color : isFocused ? '#fff' : '#666',
                      }}
                      onClick={() => handleSelect(opt.value)}
                      onMouseEnter={() => setFocusedIndex(idx)}
                    >
                      {/* Selection LED Dot */}
                      <div
                        className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${isSelected ? '' : 'opacity-0'}`}
                        style={{
                          backgroundColor: color,
                          boxShadow: `0 0 8px ${color}`,
                        }}
                      />

                      <span
                        className="truncate"
                        style={{ textShadow: isSelected ? `0 0 8px ${color}44` : 'none' }}
                      >
                        {opt.label}
                      </span>

                      {/* Subtle focus highlight bar */}
                      {isFocused && (
                        <div className="pointer-events-none absolute inset-0 bg-white/5" />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-center font-mono text-[9px] tracking-widest text-gray-700 uppercase">
                  No matches
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {label && (
        <span className="mt-2 text-[9px] font-black tracking-[0.25em] uppercase">{label}</span>
      )}
    </div>
  );
};

export default Select;
