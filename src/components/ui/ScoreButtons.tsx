interface ScoreButtonsProps {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  colorScale?: boolean;
}

export function ScoreButtons({ label, value, onChange, min = 1, max = 5, colorScale = false }: ScoreButtonsProps) {
  const range = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  const getColor = (v: number) => {
    if (!colorScale) return value === v ? 'bg-sage-600 text-white' : 'bg-warm-gray-100 text-warm-gray-600 hover:bg-sage-100';
    const ratio = (v - min) / (max - min);
    if (value === v) {
      if (ratio < 0.3) return 'bg-red-500 text-white';
      if (ratio < 0.6) return 'bg-amber-500 text-white';
      return 'bg-sage-600 text-white';
    }
    return 'bg-warm-gray-100 text-warm-gray-600 hover:bg-warm-gray-200';
  };

  return (
    <div>
      <label className="text-sm font-medium text-warm-gray-700 block mb-2">{label}</label>
      <div className="flex gap-2">
        {range.map(v => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`w-10 h-10 rounded-xl font-semibold text-sm transition-all ${getColor(v)}`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
