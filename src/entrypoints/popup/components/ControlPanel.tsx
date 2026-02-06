import { DeleteOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';

interface ControlPanelProps {
  selectedPreset: string;
  isSaved: boolean;
  onPresetChange: (value: string) => void;
  onSave: () => void;
  onLoad: () => void;
  onDelete: () => void;
  onReset: () => void;
  size?: 'middle' | 'small' | 'large';
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedPreset,
  isSaved,
  onPresetChange,
  onSave,
  onLoad,
  onDelete,
  onReset,
  size,
}) => {
  return (
    <div className="flex w-full gap-1">
      <Select
        size={size}
        value={selectedPreset}
        onChange={onPresetChange}
        placeholder={DEFAULT_PRESET_LABEL}
        options={PRESET_OPTIONS}
      />

      {!isSaved ? (
        <Button variant="primary" icon={<SaveOutlined />} onClick={onSave}>
          Save
        </Button>
      ) : (
        <>
          <Button onClick={onLoad}>Load</Button>
          <Button
            className="min-w-10"
            danger
            onClick={onDelete}
            aria-label="Delete saved settings"
            title="Delete"
          >
            <DeleteOutlined />
          </Button>
        </>
      )}

      <Button title="Reset" onClick={onReset} danger>
        <ReloadOutlined />
      </Button>
    </div>
  );
};
