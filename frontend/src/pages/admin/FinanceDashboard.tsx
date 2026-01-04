import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Plus } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface FinanceSummary {
  orderRevenue: string;
  otherIncome: string;
  totalIncome: string;
  totalExpense: string;
  profit: string;
  paidOrdersCount: number;
  unpaidOrdersCount: number;
}

const FinanceDashboard = () => {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'all' | 'month' | 'week'>('month');
  const navigate = useNavigate();

  const fetchSummary = useCallback(async () => {
    try {
      const now = new Date();
      let startDate: string | undefined;
      let endDate: string | undefined;

      if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
      } else if (period === 'week') {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1);
        startDate = weekStart.toISOString();
        endDate = now.toISOString();
      }

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/finances/summary?${params.toString()}`);
      setSummary(response.data.summary);
    } catch {
      toast.error('Грешка при зареждане на обобщение');
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const getPeriodLabel = () => {
    switch (period) {
      case 'month':
        return 'Текущ месец';
      case 'week':
        return 'Тази седмица';
      default:
        return 'Всички';
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  const profit = Number(summary?.profit || 0);
  const isProfitable = profit >= 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-textPrimary">Финансов преглед</h1>
            <p className="text-textSecondary mt-1">Управление на приходи и разходи</p>
          </div>
          <div className="flex gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'all' | 'month' | 'week')}
              className="px-4 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Избор на период"
            >
              <option value="all">Всички</option>
              <option value="month">Текущ месец</option>
              <option value="week">Тази седмица</option>
            </select>
            <Button onClick={() => navigate('/admin/finances')}>
              Всички транзакции
            </Button>
            <Button onClick={() => navigate('/admin/finances/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Добави транзакция
            </Button>
          </div>
        </div>

        <div className="bg-cardBg rounded-2xl shadow-card p-6">
          <h2 className="text-lg font-semibold text-textPrimary mb-4">{getPeriodLabel()}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Приходи от поръчки */}
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-blue-600 font-medium">Приходи от поръчки</p>
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {Number(summary?.orderRevenue || 0).toFixed(2)} лв.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {summary?.paidOrdersCount || 0} платени поръчки
              </p>
            </div>

            {/* Други приходи */}
            <div className="bg-green-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-green-600 font-medium">Други приходи</p>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900">
                {Number(summary?.otherIncome || 0).toFixed(2)} лв.
              </p>
              <p className="text-xs text-green-600 mt-1">Ръчно въведени</p>
            </div>

            {/* Разходи */}
            <div className="bg-red-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-red-600 font-medium">Разходи</p>
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-900">
                {Number(summary?.totalExpense || 0).toFixed(2)} лв.
              </p>
              <p className="text-xs text-red-600 mt-1">Общо разходи</p>
            </div>

            {/* Печалба */}
            <div className={`${isProfitable ? 'bg-primary/10' : 'bg-gray-100'} rounded-xl p-6`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm font-medium ${isProfitable ? 'text-primary' : 'text-gray-600'}`}>
                  Печалба
                </p>
                <DollarSign className={`w-5 h-5 ${isProfitable ? 'text-primary' : 'text-gray-600'}`} />
              </div>
              <p className={`text-2xl font-bold ${isProfitable ? 'text-primary' : 'text-gray-900'}`}>
                {profit.toFixed(2)} лв.
              </p>
              <p className={`text-xs mt-1 ${isProfitable ? 'text-primary' : 'text-gray-600'}`}>
                {isProfitable ? 'Положителна' : 'Отрицателна'}
              </p>
            </div>
          </div>

          {/* Допълнителна информация */}
          <div className="mt-6 pt-6 border-t border-borderSubtle">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-textSecondary mb-1">Общо приходи</p>
                <p className="text-xl font-semibold text-textPrimary">
                  {Number(summary?.totalIncome || 0).toFixed(2)} лв.
                </p>
              </div>
              <div>
                <p className="text-sm text-textSecondary mb-1">Неплатени поръчки</p>
                <p className="text-xl font-semibold text-textPrimary">
                  {summary?.unpaidOrdersCount || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-textSecondary mb-1">Margin</p>
                <p className="text-xl font-semibold text-textPrimary">
                  {summary?.totalIncome && Number(summary.totalIncome) > 0
                    ? ((profit / Number(summary.totalIncome)) * 100).toFixed(1)
                    : '0.0'}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default FinanceDashboard;