import { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

type Period = 'week' | 'month' | 'quarter' | 'semester' | 'year' | 'all';

const FinanceChart = () => {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('year');

  const fetchFinanceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/dashboard/chart?period=${period}`);
      const monthlyData = response.data.monthlyData || [];
      setData(monthlyData);
    } catch {
      toast.error('Грешка при зареждане на финанси');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  const periods = [
    { value: 'week', label: 'Седмица' },
    { value: 'month', label: 'Месец' },
    { value: 'quarter', label: 'Тримесечие' },
    { value: 'semester', label: 'Полугодие' },
    { value: 'year', label: 'Година' },
    { value: 'all', label: 'Всички' },
  ];

  if (isLoading) {
    return (
      <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">Финансов Преглед</h2>
        <div className="animate-pulse h-56 sm:h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-textPrimary">Финансов Преглед</h2>
        <div className="flex flex-wrap gap-2">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value as Period)}
              className={`px-3 py-1 text-xs sm:text-sm rounded-lg transition-colors ${
                period === p.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-textSecondary hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-56 sm:h-64 bg-mainBg rounded-xl">
          <p className="text-textSecondary">Няма финансови данни за избрания период</p>
        </div>
      ) : (
        <div className="h-72 sm:h-[300px] -mx-2 sm:mx-0 overflow-x-auto">
          <div className="min-w-[520px] sm:min-w-0 px-2 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                <XAxis
                  dataKey="month"
                  stroke="var(--color-text-muted)"
                  style={{ fontSize: '12px' }}
                  minTickGap={12}
                />
                <YAxis stroke="var(--color-text-muted)" style={{ fontSize: '12px' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                  contentStyle={{
                    backgroundColor: 'var(--color-card-bg)',
                    border: '1px solid var(--color-border-strong)',
                    borderRadius: '8px',
                    color: 'var(--color-text-primary)',
                  }}
                  labelStyle={{
                    color: 'var(--color-text-muted)',
                  }}
                  itemStyle={{
                    color: 'var(--color-text-primary)',
                  }}
                  formatter={(value: number | undefined) =>
                    value !== undefined ? `${value.toFixed(2)} €` : '0.00 €'
                  }
                />
                <Legend wrapperStyle={{ color: 'var(--color-text-secondary)' }} />
                <Bar dataKey="income" fill="#16A34A" name="Приходи" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expense" fill="#DC2626" name="Разходи" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceChart;


