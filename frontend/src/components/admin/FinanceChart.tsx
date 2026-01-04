import { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

type Period = 'week' | 'month' | 'quarter' | 'semester' | 'year';

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
  ];

  if (isLoading) {
    return (
      <div className="bg-cardBg rounded-2xl shadow-card p-6">
        <h2 className="text-lg font-semibold text-textPrimary mb-4">Финансов Преглед</h2>
        <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-cardBg rounded-2xl shadow-card p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-textPrimary">Финансов Преглед</h2>
        <div className="flex gap-2">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value as Period)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
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
        <div className="flex items-center justify-center h-64 bg-mainBg rounded-xl">
          <p className="text-textSecondary">Няма финансови данни за избрания период</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
            <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
           formatter={(value: number | undefined) => value !== undefined ? `${value.toFixed(2)} лв.` : '0.00 лв.'}
            />
            <Legend />
            <Bar dataKey="income" fill="#16A34A" name="Приходи" radius={[8, 8, 0, 0]} />
            <Bar dataKey="expense" fill="#DC2626" name="Разходи" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default FinanceChart;