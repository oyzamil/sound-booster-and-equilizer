import { KeyboardEvent, useEffect, useRef, useState } from 'react';

interface PresetNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  title?: string;
}

const PresetNameModal: React.FC<PresetNameModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Enter preset name:',
}) => {
  const [presetName, setPresetName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setPresetName('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (presetName.trim()) {
      onConfirm(presetName.trim());
      setPresetName('');
    }
  };

  const handleCancel = () => {
    setPresetName('');
    onClose();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="bg-opacity-70 fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-3 backdrop-blur-lg"
      onClick={handleCancel}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="border-theme bg-theme w-100 rounded-md border p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="heading mb-2">{title}</h3>
        <Input
          type="text"
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Preset name"
          autoFocus={!isOpen}
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button onClick={handleCancel} danger>
            Cancel
          </Button>
          <Button onClick={handleConfirm} variant="primary" disabled={!presetName.trim()}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PresetNameModal;
