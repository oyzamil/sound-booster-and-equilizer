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

interface Message {
  target: 'worker' | 'offscreen' | 'popup';
  type: string;
  tabId?: number;
  data?: AudioSettings;
  value?: any;
  preset?: EqualizerSettings;
  streamId?: string;
  state?: Browser.windows.WindowState;
  settings?: AudioSettings;
  index?: number;
  success?: boolean;
}

interface AudioSettings {
  compressor: CompressorSettings;
  eq: EqualizerSettings;
  mono: boolean;
  invert: boolean;
  pan: number;
  volume: number;
}

interface CompressorSettings {
  threshold: number;
  attack: number;
  release: number;
  ratio: number;
  knee: number;
}

interface EqualizerSettings {
  twenty: number;
  fifty: number;
  oneHundred: number;
  twoHundred: number;
  fiveHundred: number;
  oneThousand: number;
  twoThousand: number;
  fiveThousand: number;
  tenThousand: number;
  twentyThousand: number;
}

interface StorageData {
  saved?: boolean;
  settings?: AudioSettings;
  collapsed?: boolean;
}

interface CapturedAudioConfig {
  tabId: number;
  stream: MediaStream;
  settings: AudioSettings;
}

interface EqualizerBand {
  type: BiquadFilterType;
  frequency: number;
}

type PresetName =
  | 'acoustic'
  | 'bassBooster'
  | 'bassReducer'
  | 'classical'
  | 'dance'
  | 'deep'
  | 'electronic'
  | 'flat'
  | 'hiphop'
  | 'jazz'
  | 'latin'
  | 'loudness'
  | 'lounge'
  | 'piano'
  | 'pop'
  | 'rnb'
  | 'rock'
  | 'smallSpeakers'
  | 'spokenWord'
  | 'trebleBooster'
  | 'trebleReducer'
  | 'vocalBooster';
