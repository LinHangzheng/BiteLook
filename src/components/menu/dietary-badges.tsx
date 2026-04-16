import type { DietaryLabel } from '@/types/menu';

interface DietaryBadgesProps {
  labels?: DietaryLabel[];
  compact?: boolean;
}

const labelConfig: Record<DietaryLabel, { emoji: string; text: string; bgColor: string; textColor: string }> = {
  vegan: { emoji: '🌱', text: 'Vegan', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  vegetarian: { emoji: '🥬', text: 'Vegetarian', bgColor: 'bg-emerald-100', textColor: 'text-emerald-800' },
  'gluten-free': { emoji: '🌾', text: 'GF', bgColor: 'bg-amber-100', textColor: 'text-amber-800' },
  'dairy-free': { emoji: '🥛', text: 'DF', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
  'nut-free': { emoji: '🥜', text: 'NF', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
};

export function DietaryBadges({ labels, compact = false }: DietaryBadgesProps) {
  if (!labels || labels.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {labels.map((label) => {
        const config = labelConfig[label];
        if (!config) return null;

        return (
          <span
            key={label}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${config.bgColor} ${config.textColor}`}
            title={label}
          >
            <span>{config.emoji}</span>
            {!compact && <span>{config.text}</span>}
          </span>
        );
      })}
    </div>
  );
}
