type OpenPageOptions = {
  current?: boolean;
  active?: boolean;
  newWindow?: boolean;
};
type Theme = 'light' | 'dark' | 'system';
type BrowserName = 'firefox' | 'chromium';

type ComponentSize = 'small' | 'middle' | 'large';
type Orientation = 'horizontal' | 'vertical';

interface KnobProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  label?: string | React.ReactNode;
  size?: ComponentSize;
  onChange: (value: number) => void;
  color?: string;
  trackColor?: string;
  unit?: string;
  isBipolar?: boolean;
  resetValue?: number;
  soundEnabled?: boolean;
}

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  label?: string | React.ReactNode;
  size?: ComponentSize;
  thumbSize?: ComponentSize | number;
  orientation?: SliderOrientation;
  onChange: (value: number) => void;
  color?: string;
  unit?: string;
  resetValue?: number;
  soundEnabled?: boolean;
  suffix?: string | React.ReactNode;
  prefix?: string | React.ReactNode;
}

interface SwitchProps {
  orientation?: Orientation;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: ComponentSize;
  color?: string;
  soundEnabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string | React.ReactNode;
  placeholder?: string;
  size?: ComponentSize;
  color?: string;
  search?: boolean;
  keyboardNavigation?: boolean;
  soundEnabled?: boolean;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'default' | 'text' | 'link';
  danger?: boolean;
  loading?: boolean;
  size?: ComponentSize;
  label?: string | React.ReactNode;
  icon?: React.ReactNode;
  soundEnabled?: boolean;
  color?: string;
  href?: string;
  target?: string;
}

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string | React.ReactNode;
  size?: ComponentSize;
  soundEnabled?: boolean;
  color?: string;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string | React.ReactNode;
  size?: ComponentSize;
  soundEnabled?: boolean;
  color?: string;
}

interface SegmentedProps {
  options: SegmentedOption[];
  value: string | React.ReactNode;
  onChange: (value: string) => void;
  label?: string;
  size?: ComponentSize;
  color?: string;
  block?: boolean;
  soundEnabled?: boolean;
}

interface EQBand {
  frequency: number;
  gain: number;
  label: string;
}

interface AudioSettings {
  enabled: boolean;
  volume: number;
  bands: EQBand[];
  stereoMode: 'stereo' | 'mono';
  invertChannels: boolean;
  balance: number;
}

interface Preset {
  id: string;
  name: string;
  settings: Omit<AudioSettings, 'enabled'>;
  isCustom: boolean;
}
