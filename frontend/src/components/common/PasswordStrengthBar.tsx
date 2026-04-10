import { calculatePasswordStrength } from '../../utils/validation';

interface PasswordStrengthBarProps {
  password: string;
}

export const PasswordStrengthBar = ({ password }: PasswordStrengthBarProps) => {
  const { score, label, color } = calculatePasswordStrength(password);
  
  if (!password) return null;
  
  const maxScore = 7;
  const percentage = (score / maxScore) * 100;
  
  const getWidthClass = (percent: number) => {
    if (percent === 0) return 'w-0';
    if (percent <= 14) return 'w-[14%]';
    if (percent <= 28) return 'w-[28%]';
    if (percent <= 42) return 'w-[42%]';
    if (percent <= 57) return 'w-[57%]';
    if (percent <= 71) return 'w-[71%]';
    if (percent <= 85) return 'w-[85%]';
    return 'w-full';
  };
  
  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-textSecondary">Сила на паролата:</span>
        <span className="text-xs font-medium text-textPrimary">{label}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${color} ${getWidthClass(percentage)}`}
        />
      </div>
    </div>
  );
};

