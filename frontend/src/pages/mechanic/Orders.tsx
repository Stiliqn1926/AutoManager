import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ClipboardList, User, Car, Calendar } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { getMechanicOrders } from '../../services/mechanicService';
import type { MechanicOrder } from '../../types/mechanic';
import toast from 'react-hot-toast';

const MechanicOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<MechanicOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const fetchOrders = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const data = await getMechanicOrders({
        page: pagination.currentPage,
        limit: 20,
        status: statusFilter || undefined,
        signal,
      });
      setOrders(data.orders);
      setPagination({
        currentPage: data.pagination.currentPage,
        totalPages: data.pagination.totalPages,
        totalItems: data.pagination.totalItems,
      });
    } catch (error: unknown) {
      // Ignore cancel/abort errors (component unmounted or request cancelled)
      if (axios.isCancel(error) || (error instanceof Error && error.name === 'AbortError')) {
        return;
      }
      toast.error('Грешка при зареждане на поръчки');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, statusFilter]);

  useEffect(() => {
    const controller = new AbortController();
    fetchOrders(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchOrders]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      WAITING: { label: 'Чакащ', className: 'bg-yellow-100 text-yellow-800' },
      IN_PROGRESS: { label: 'В процес', className: 'bg-blue-100 text-blue-800' },
      READY: { label: 'Готов', className: 'bg-green-100 text-green-800' },
      COMPLETED: { label: 'Завършен', className: 'bg-gray-100 text-gray-800' },
      CANCELLED: { label: 'Отменен', className: 'bg-red-100 text-red-800' },
    };

    const config =
      statusConfig[status] || {
        label: status,
        className: 'bg-gray-100 text-gray-800',
      };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { label: string; className: string }> = {
      LOW: { label: 'Нисък', className: 'bg-gray-100 text-gray-600' },
      MEDIUM: { label: 'Среден', className: 'bg-blue-100 text-blue-700' },
      HIGH: { label: 'Висок', className: 'bg-orange-100 text-orange-700' },
      URGENT: { label: 'Спешен', className: 'bg-red-100 text-red-700' },
    };

    const config = priorityConfig[priority] || { label: priority, className: 'bg-gray-100 text-gray-600' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">Поръчки</h1>
            <p className="text-textSecondary mt-1">Възложени поръчки за работа</p>
          </div>
          <div className="text-sm text-textSecondary">
            Общо: <span className="font-semibold text-textPrimary">{pagination.totalItems}</span> поръчки
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <label htmlFor="status-filter" className="block text-sm font-medium text-textSecondary mb-2">
                Филтър по статус
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, currentPage: 1 }));
                }}
                className="w-full px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Всички</option>
                <option value="WAITING,IN_PROGRESS,READY">Активни</option>
                <option value="WAITING">Чакащи</option>
                <option value="IN_PROGRESS">В процес</option>
                <option value="READY">Готови</option>
                <option value="COMPLETED">Завършени</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-textSecondary">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Няма намерени поръчки</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-borderSubtle">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Номер / Дата
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Автомобил
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Клиент
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Описание
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Приоритет
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Действие
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderSubtle">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/mechanic/orders/${order.id}`)}
                    >
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-textPrimary">{order.displayOrderNumber || order.orderNumber}</div>
                          <div className="text-xs text-textSecondary flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-textSecondary" />
                          <div>
                            <div className="text-sm font-medium text-textPrimary">
                              {order.vehicle.brand} {order.vehicle.model}
                            </div>
                            <div className="text-xs text-textSecondary">{order.vehicle.licensePlate}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-textSecondary" />
                          <div className="text-sm text-textPrimary">
                            {order.client.firstName} {order.client.lastName}
                          </div>
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4">
                        <div className="text-sm text-textPrimary max-w-xs truncate">
                          {order.description || 'Няма описание'}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                      <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">{getPriorityBadge(order.priority)}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/mechanic/orders/${order.id}`);
                          }}
                          className="text-primary hover:text-primary-700 text-sm font-medium"
                        >
                          Отвори
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-borderSubtle">
              <div className="text-sm text-textSecondary">
                Страница {pagination.currentPage} от {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={pagination.currentPage === 1}
                  className="px-4 py-2 text-sm border border-borderSubtle rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Предишна
                </button>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-4 py-2 text-sm border border-borderSubtle rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Следваща
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default MechanicOrders;
