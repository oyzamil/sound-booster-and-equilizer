interface PresetManagerProps {
  presets: Preset[];
  activePresetId: string | null;
  onApplyPreset: (preset: Preset) => void;
  onSavePreset: (name: string) => void;
  onDeletePreset: (id: string) => void;
  onImportPreset: (json: string) => void;
  onExportPreset: (id: string) => void;
}

export function PresetManager({
  presets,
  activePresetId,
  onApplyPreset,
  onSavePreset,
  onDeletePreset,
  onImportPreset,
  onExportPreset,
}: PresetManagerProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSave() {
    if (presetName.trim()) {
      onSavePreset(presetName.trim());
      setPresetName('');
      setShowSaveDialog(false);
    }
  }

  function handleImport() {
    fileInputRef.current?.click();
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        onImportPreset(json);
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  const presetOptions = presets.map((preset) => ({
    value: preset.id,
    label: `${preset.name}${preset.isCustom ? ' ★' : ''}`,
  }));

  return (
    <div className="my-2">
      <div className="mb-3 grid grid-cols-2 gap-2">
        <Select
          value={activePresetId || ''}
          placeholder="Select Preset"
          options={presetOptions}
          onChange={(value) => {
            const preset = presets.find((p) => p.id === value);
            if (preset) {
              onApplyPreset(preset);
            }
          }}
        />
        <div className="flex gap-2">
          <Button className="min-w-7.5" variant="primary" onClick={() => setShowSaveDialog(true)}>
            Export
          </Button>
          <Button className="min-w-7.5" onClick={handleImport}>
            Import
          </Button>
        </div>

        <input
          className="hidden"
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
        />

        {/* {presets.map((preset) => (
          <div className="group relative" key={preset.id}>
            <button
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                activePresetId === preset.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              onClick={() => onApplyPreset(preset)}
            >
              <div className="flex items-center justify-between">
                <span className="truncate">{preset.name}</span>
                {preset.isCustom && <span className="ml-2 text-xs opacity-70">★</span>}
              </div>
            </button>

            {preset.isCustom && (
              <div className="absolute top-0 right-0 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  className="rounded bg-slate-600 p-1 text-xs hover:bg-slate-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExportPreset(preset.id);
                  }}
                  title="Export"
                >
                  ↓
                </button>
                <button
                  className="rounded bg-red-600 p-1 text-xs hover:bg-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete preset "${preset.name}"?`)) {
                      onDeletePreset(preset.id);
                    }
                  }}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        ))} */}
      </div>

      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="border-theme bg-theme w-80 rounded-lg border p-6">
            <h3 className="heading mb-2">Save Preset</h3>
            <Input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Enter preset name"
              autoFocus
            />
            <div className="mt-2 flex justify-between gap-2">
              <Button variant="primary" onClick={handleSave} disabled={!presetName.trim()}>
                Save
              </Button>
              <Button
                onClick={() => {
                  setShowSaveDialog(false);
                  setPresetName('');
                }}
                danger
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
