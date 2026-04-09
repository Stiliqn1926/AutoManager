import type { LucideIcon } from 'lucide-react';

type Props = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down';
};

const StatsCard = ({
  icon: Icon,
  label,
  value,
  subtitle,
}: Props) => {
  return (
    <div className="bg-cardBg border border-borderSubtle rounded-2xl p-4 sm:p-6 shadow-card">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-100 text-textSecondary">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="text-xs sm:text-sm text-textSecondary">{label}</span>
        </div>
      </div>

      <div className="text-2xl sm:text-3xl font-semibold text-textPrimary mb-1">
        {value}
      </div>

      {subtitle && (
        <div className="text-xs sm:text-sm text-textMuted">{subtitle}</div>
      )}
    </div>
  );
};

export default StatsCard;

