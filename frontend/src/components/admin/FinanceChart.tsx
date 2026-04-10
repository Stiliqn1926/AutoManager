import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface ChartPoint extends MonthlyData {
  profit: number;
}

interface TooltipPayloadItem {
  dataKey?: string;
  value?: number;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: TooltipPayloadItem[];
}

type Period = 'week' | 'month' | 'quarter' | 'semester' | 'year' | 'all';

const bgCurrencyCompact = new Intl.NumberFormat('bg-BG', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const bgCurrencyStandard = new Intl.NumberFormat('bg-BG', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const bgCurrencyInteger = new Intl.NumberFormat('bg-BG', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const formatAxisValue = (value: number): string => {
  if (Math.abs(value) < 1000) {
    return `${value}`;
  }
  return `${bgCurrencyCompact.format(value)} €`;
};

const formatCurrency = (value: number): string => bgCurrencyStandard.format(value);

const PeriodButtons = ({
  period,
  onChange,
}: {
  period: Period;
  onChange: (value: Period) => void;
}) => {
  const periods: Array<{ value: Period; label: string }> = [
    { value: 'week', label: 'Седмица' },
    { value: 'month', label: 'Месец' },
    { value: 'quarter', label: 'Тримесечие' },
    { value: 'semester', label: 'Полугодие' },
    { value: 'year', label: 'Година' },
    { value: 'all', label: 'Всички' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:overflow-visible sm:mx-0 sm:px-0">
      {periods.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={`shrink-0 px-3 py-1.5 text-xs sm:text-sm rounded-lg border transition-colors duration-200 ${
            period === item.value
              ? 'bg-primary text-white border-primary shadow-sm'
              : 'bg-mainBg text-textSecondary border-borderSubtle hover:border-borderStrong hover:text-textPrimary'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

const ChartTooltip = ({ active, label, payload }: ChartTooltipProps) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const getValue = (key: string) =>
    Number(payload.find((item) => item.dataKey === key)?.value ?? 0);

  const income = getValue('income');
  const expense = getValue('expense');
  const profit = getValue('profit');
  const profitColor = profit >= 0 ? 'text-success' : 'text-error';

  return (
    <div className="rounded-xl border border-borderStrong bg-cardBg/95 shadow-card px-3 py-2 backdrop-blur-sm">
      <p className="text-xs text-textMuted mb-2">{label}</p>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center justify-between gap-6">
          <span className="text-textSecondary">Приходи</span>
          <span className="font-semibold text-success">{formatCurrency(income)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-textSecondary">Разходи</span>
          <span className="font-semibold text-error">{formatCurrency(expense)}</span>
        </div>
        <div className="flex items-center justify-between gap-6 border-t border-borderSubtle pt-1.5">
          <span className="text-textSecondary">Нетен резултат</span>
          <span className={`font-semibold ${profitColor}`}>{formatCurrency(profit)}</span>
        </div>
      </div>
    </div>
  );
};

const FinanceChart = () => {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('year');

  const fetchFinanceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/dashboard/chart?period=${period}`);
      const monthlyData = (response.data.monthlyData ?? []) as MonthlyData[];
      setData(monthlyData);
    } catch {
      toast.error('Грешка при зареждане на финансовите данни');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void fetchFinanceData();
  }, [fetchFinanceData]);

  const chartData = useMemo<ChartPoint[]>(
    () =>
      data.map((item) => ({
        ...item,
        profit: item.income - item.expense,
      })),
    [data],
  );

  const totals = useMemo(() => {
    const totalIncome = chartData.reduce((sum, item) => sum + item.income, 0);
    const totalExpense = chartData.reduce((sum, item) => sum + item.expense, 0);
    const totalProfit = totalIncome - totalExpense;
    return { totalIncome, totalExpense, totalProfit };
  }, [chartData]);

  const chartMinWidth = useMemo(() => {
    const points = chartData.length;
    if (points <= 7) {
      return undefined;
    }
    return Math.min(1400, points * 86);
  }, [chartData.length]);

  if (isLoading) {
    return (
      <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">
          Финансов преглед
        </h2>
        <div className="animate-pulse h-[280px] sm:h-[340px] bg-mainBg rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
      <div className="flex flex-col gap-4 mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <h2 className="text-base sm:text-lg font-semibold text-textPrimary">Финансов преглед</h2>
          <PeriodButtons period={period} onChange={setPeriod} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-borderSubtle bg-mainBg p-3 sm:p-4">
            <p className="text-xs text-textMuted mb-1">Общо приходи</p>
            <p className="text-sm sm:text-base font-semibold text-success">
              {bgCurrencyInteger.format(totals.totalIncome)}
            </p>
          </div>
          <div className="rounded-xl border border-borderSubtle bg-mainBg p-3 sm:p-4">
            <p className="text-xs text-textMuted mb-1">Общо разходи</p>
            <p className="text-sm sm:text-base font-semibold text-error">
              {bgCurrencyInteger.format(totals.totalExpense)}
            </p>
          </div>
          <div className="rounded-xl border border-borderSubtle bg-mainBg p-3 sm:p-4">
            <p className="text-xs text-textMuted mb-1">Нетен резултат</p>
            <p
              className={`text-sm sm:text-base font-semibold ${
                totals.totalProfit >= 0 ? 'text-success' : 'text-error'
              }`}
            >
              {bgCurrencyInteger.format(totals.totalProfit)}
            </p>
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] sm:h-[340px] bg-mainBg rounded-xl border border-borderSubtle">
          <p className="text-sm sm:text-base text-textSecondary">
            Няма финансови данни за избрания период
          </p>
        </div>
      ) : (
        <div className="h-[300px] sm:h-[360px] overflow-x-auto">
          <div className="h-full" style={chartMinWidth ? { minWidth: `${chartMinWidth}px` } : undefined}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 12, left: 0, bottom: 6 }}
              >
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="var(--color-border-subtle)"
                  strokeDasharray="4 4"
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  stroke="var(--color-text-muted)"
                  tick={{ fontSize: 12 }}
                  minTickGap={16}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-border-subtle)' }}
                />

                <YAxis
                  stroke="var(--color-text-muted)"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={68}
                  tickFormatter={(value: number) => formatAxisValue(value)}
                />

                <Tooltip
                  cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                  content={<ChartTooltip />}
                />

                <Legend
                  wrapperStyle={{
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                    paddingTop: '8px',
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="income"
                  name="Приходи (тенденция)"
                  stroke="#22C55E"
                  fill="url(#incomeGradient)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />

                <Bar
                  dataKey="expense"
                  name="Разходи"
                  fill="#EF4444"
                  radius={[8, 8, 0, 0]}
                  barSize={22}
                />

                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Нетен резултат"
                  stroke="#F97316"
                  strokeWidth={2}
                  dot={{ r: 2.5 }}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceChart;

