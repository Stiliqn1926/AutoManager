import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();

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
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° Ð¾Ð±Ð¾Ð±Ñ‰ÐµÐ½Ð¸Ðµ');
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary, location]);

  const getPeriodLabel = () => {
    switch (period) {
      case 'month':
        return 'Ð¢ÐµÐºÑƒÑ‰ Ð¼ÐµÑÐµÑ†';
      case 'week':
        return 'Ð¢Ð°Ð·Ð¸ ÑÐµÐ´Ð¼Ð¸Ñ†Ð°';
      default:
        return 'Ð’ÑÐ¸Ñ‡ÐºÐ¸';
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
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">Ð¤Ð¸Ð½Ð°Ð½ÑÐ¾Ð² Ð¿Ñ€ÐµÐ³Ð»ÐµÐ´</h1>
            <p className="text-textSecondary mt-1">Ð£Ð¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð¸Ðµ Ð½Ð° Ð¿Ñ€Ð¸Ñ…Ð¾Ð´Ð¸ Ð¸ Ñ€Ð°Ð·Ñ…Ð¾Ð´Ð¸</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 lg:ml-auto">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'all' | 'month' | 'week')}
              className="w-full sm:w-auto px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Ð˜Ð·Ð±Ð¾Ñ€ Ð½Ð° Ð¿ÐµÑ€Ð¸Ð¾Ð´"
            >
              <option value="all">Ð’ÑÐ¸Ñ‡ÐºÐ¸</option>
              <option value="month">Ð¢ÐµÐºÑƒÑ‰ Ð¼ÐµÑÐµÑ†</option>
              <option value="week">Ð¢Ð°Ð·Ð¸ ÑÐµÐ´Ð¼Ð¸Ñ†Ð°</option>
            </select>
            <Button onClick={() => navigate('/admin/finances')} className="w-full sm:w-auto">
              Ð’ÑÐ¸Ñ‡ÐºÐ¸ Ñ‚Ñ€Ð°Ð½Ð·Ð°ÐºÑ†Ð¸Ð¸
            </Button>
            <Button onClick={() => navigate('/admin/finances/create')} className="w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Ð”Ð¾Ð±Ð°Ð²Ð¸ Ñ‚Ñ€Ð°Ð½Ð·Ð°ÐºÑ†Ð¸Ñ
            </Button>
          </div>
        </div>

        <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-textPrimary mb-4">{getPeriodLabel()}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            <div className="bg-blue-50 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-blue-600 font-medium">ÐŸÑ€Ð¸Ñ…Ð¾Ð´Ð¸ Ð¾Ñ‚ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ¸</p>
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-blue-900">
                {Number(summary?.orderRevenue || 0).toFixed(2)} â‚¬
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {summary?.paidOrdersCount || 0} Ð¿Ð»Ð°Ñ‚ÐµÐ½Ð¸ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ¸
              </p>
            </div>

            
            <div className="bg-green-50 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-green-600 font-medium">Ð”Ñ€ÑƒÐ³Ð¸ Ð¿Ñ€Ð¸Ñ…Ð¾Ð´Ð¸</p>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-green-900">
                {Number(summary?.otherIncome || 0).toFixed(2)} â‚¬
              </p>
              <p className="text-xs text-green-600 mt-1">Ð ÑŠÑ‡Ð½Ð¾ Ð²ÑŠÐ²ÐµÐ´ÐµÐ½Ð¸</p>
            </div>

            
            <div className="bg-red-50 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-red-600 font-medium">Ð Ð°Ð·Ñ…Ð¾Ð´Ð¸</p>
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-red-900">
                {Number(summary?.totalExpense || 0).toFixed(2)} â‚¬
              </p>
              <p className="text-xs text-red-600 mt-1">ÐžÐ±Ñ‰Ð¾ Ñ€Ð°Ð·Ñ…Ð¾Ð´Ð¸</p>
            </div>

            
            <div className={`${isProfitable ? 'bg-primary/10' : 'bg-gray-100'} rounded-xl p-4 sm:p-6`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm font-medium ${isProfitable ? 'text-primary' : 'text-gray-600'}`}>
                  ÐŸÐµÑ‡Ð°Ð»Ð±Ð°
                </p>
                <DollarSign className={`w-5 h-5 ${isProfitable ? 'text-primary' : 'text-gray-600'}`} />
              </div>
              <p className={`text-xl sm:text-2xl font-bold ${isProfitable ? 'text-primary' : 'text-gray-900'}`}>
                {profit.toFixed(2)} â‚¬
              </p>
              <p className={`text-xs mt-1 ${isProfitable ? 'text-primary' : 'text-gray-600'}`}>
                {isProfitable ? 'ÐŸÐ¾Ð»Ð¾Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð°' : 'ÐžÑ‚Ñ€Ð¸Ñ†Ð°Ñ‚ÐµÐ»Ð½Ð°'}
              </p>
            </div>
          </div>

          
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-borderSubtle">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <p className="text-sm text-textSecondary mb-1">ÐžÐ±Ñ‰Ð¾ Ð¿Ñ€Ð¸Ñ…Ð¾Ð´Ð¸</p>
                <p className="text-lg sm:text-xl font-semibold text-textPrimary">
                  {Number(summary?.totalIncome || 0).toFixed(2)} â‚¬
                </p>
              </div>
              <div>
                <p className="text-sm text-textSecondary mb-1">ÐÐµÐ¿Ð»Ð°Ñ‚ÐµÐ½Ð¸ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ¸</p>
                <p className="text-lg sm:text-xl font-semibold text-textPrimary">
                  {summary?.unpaidOrdersCount || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-textSecondary mb-1">Margin</p>
                <p className="text-lg sm:text-xl font-semibold text-textPrimary">
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



