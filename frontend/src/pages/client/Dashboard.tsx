import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServiceCompany } from '../../hooks/useServiceCompany';
import NoServiceScreen from './NoServiceScreen';
import {
  Wrench,
  Bell,
  FileText,
  Car,
  ClipboardList,
  Mail,
  Calendar,
  DollarSign,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface DashboardData {
  overview: {
    activeOrders: number;
    unreadNotifications: number;
    unpaidInvoices: number;
  };
  activeOrdersList: {
    id: string;
    orderNumber: string;
    displayOrderNumber?: string | null;
    description: string;
    status: string;
    totalPrice: string | null;
    endDate: string | null;
    createdAt: string;
    vehicle: {
      brand: string;
      model: string;
      licensePlate: string;
    };
    worker: string | null;
  }[];
  recentActivity: {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    orderNumber: string | null;
    displayOrderNumber?: string | null;
  }[];
}

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { selectedServiceCompany, selectedClientId, serviceCompanies } =
    useServiceCompany();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    if (!selectedServiceCompany) return;

    setIsLoading(true);
    try {
      const response = await api.get('/client/overview', {
        params: { serviceCompanyId: selectedServiceCompany.id },
      });
      setDashboardData(response.data);
    } catch (error) {
      toast.error('Грешка при зареждане на данни');
      console.error('Dashboard error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedServiceCompany]);

  useEffect(() => {
    if (selectedServiceCompany && selectedClientId) {
      fetchDashboard();
    }
  }, [selectedServiceCompany, selectedClientId, fetchDashboard]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      WAITING: { label: 'Изчакване', className: 'bg-yellow-100 text-yellow-800' },
      IN_PROGRESS: { label: 'В процес', className: 'bg-blue-100 text-blue-800' },
      READY: { label: 'Готов', className: 'bg-green-100 text-green-800' },
      COMPLETED: { label: 'Завършен', className: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status] || {
      label: status,
      className: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('bg-BG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('bg-BG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!selectedServiceCompany && serviceCompanies.length === 0) {
    return <NoServiceScreen />;
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!dashboardData) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-textSecondary mb-4">Грешка при зареждане на данни</p>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700"
          >
            Опитай отново
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-textPrimary">Начало</h1>
          <p className="text-textSecondary mt-1">
            Преглед на вашите активни ремонти и известия
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/client/vehicles')}
            className="p-4 bg-cardBg rounded-lg hover:bg-primary/5 transition-colors text-left border"
          >
            <Car className="w-6 h-6 text-primary mb-2" />
            Моите автомобили
          </button>

          <button
            onClick={() => navigate('/client/orders')}
            className="p-4 bg-cardBg rounded-lg hover:bg-primary/5 transition-colors text-left border"
          >
            <ClipboardList className="w-6 h-6 text-primary mb-2" />
            Активни поръчки
          </button>

          <button
            onClick={() => navigate('/client/invoices')}
            className="p-4 bg-cardBg rounded-lg hover:bg-primary/5 transition-colors text-left border"
          >
            <FileText className="w-6 h-6 text-primary mb-2" />
            Фактури
          </button>

          <button
            onClick={() => navigate('/client/notifications')}
            className="p-4 bg-cardBg rounded-lg hover:bg-primary/5 transition-colors text-left border"
          >
            <Mail className="w-6 h-6 text-primary mb-2" />
            Известия
          </button>
        </div>

       {/* Overview Cards */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  
  {/* Active Orders */}
  <div className="bg-cardBg rounded-2xl shadow-card p-6">
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 bg-gray-100 rounded-lg">
        <Wrench className="w-6 h-6 text-textSecondary" />
      </div>
      <span className="text-3xl font-bold text-textPrimary">
        {dashboardData.overview.activeOrders}
      </span>
    </div>
    <h3 className="text-sm font-medium text-textSecondary mb-1">
      Активни ремонти
    </h3>
  </div>

  {/* Notifications */}
  <div className="bg-cardBg rounded-2xl shadow-card p-6">
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 bg-gray-100 rounded-lg">
        <Bell className="w-6 h-6 text-textSecondary" />
      </div>
      <span className="text-3xl font-bold text-textPrimary">
        {dashboardData.overview.unreadNotifications}
      </span>
    </div>
    <h3 className="text-sm font-medium text-textSecondary mb-1">
      Непрочетени известия
    </h3>
  </div>

  {/* Invoices */}
  <div className="bg-cardBg rounded-2xl shadow-card p-6">
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 bg-gray-100 rounded-lg">
        <FileText className="w-6 h-6 text-textSecondary" />
      </div>
      <span className="text-3xl font-bold text-textPrimary">
        {dashboardData.overview.unpaidInvoices}
      </span>
    </div>
    <h3 className="text-sm font-medium text-textSecondary mb-1">
      Неплатени фактури
    </h3>
  </div>

</div>


        {/* Active Orders List */}
        <div className="bg-cardBg rounded-2xl shadow-card p-6">
          <h2 className="text-xl font-bold text-textPrimary mb-4">
            Активни ремонти
          </h2>

          {dashboardData.activeOrdersList.length === 0 ? (
            <div className="text-center py-8 text-textSecondary">
              Няма активни ремонти в момента
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.activeOrdersList.map((order) => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/client/orders/${order.id}`)}
                  className="p-4 border border-borderSubtle rounded-lg hover:bg-mainBg cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-textPrimary">
                          {order.vehicle.brand} {order.vehicle.model}
                        </span>
                        <span className="text-sm text-textMuted">
                          ({order.vehicle.licensePlate})
                        </span>
                      </div>
                      <p className="text-sm text-textSecondary line-clamp-1">
                        {order.description}
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-textMuted">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {order.endDate
                        ? `Очаквана: ${formatDate(order.endDate)}`
                        : 'Без дата'}
                    </div>
                    {order.totalPrice && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {order.totalPrice} €
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-cardBg rounded-2xl shadow-card p-6">
          <h2 className="text-xl font-bold text-textPrimary mb-4">
            Последна активност
          </h2>

          {dashboardData.recentActivity.length === 0 ? (
            <div className="text-center py-8 text-textSecondary">
              Няма нова активност
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {dashboardData.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className={`p-4 border-l-4 rounded-r-lg ${
                    activity.isRead
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-primary bg-primary/5'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-sm">
                      {activity.title}
                    </h3>
                    <span className="text-xs text-textMuted">
                      {formatTime(activity.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-textSecondary">
                    {activity.message}
                  </p>
                  {activity.orderNumber && (
                    <span className="inline-block mt-2 text-xs font-mono text-primary">
                      Поръчка: {activity.displayOrderNumber || activity.orderNumber}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ClientDashboard;
