import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Car,
  Phone,
  ArrowRight,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import StatsCard from '../../components/admin/StatsCard';
import ScheduleDetailsModal from '../../components/mechanic/ScheduleDetailsModal';
import { getMechanicDashboard } from '../../services/mechanicService';
import type { MechanicDashboardData } from '../../types/mechanic';
import toast from 'react-hot-toast';

interface ScheduleTaskForModal {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  title?: string;
  description?: string | null;
  order?: {
    orderNumber: string;
    displayOrderNumber?: string | null;
    status: string;
  } | null;
}

const MechanicDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<MechanicDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<ScheduleTaskForModal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTaskClick = (task: ScheduleTaskForModal) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  // ✅ САМО ЕДНА заявка, САМО веднъж
  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const data = await getMechanicDashboard();
      setDashboardData(data);
    } catch  {
      toast.error('Грешка при зареждане на данни');
    } finally {
      setIsLoading(false);
    }
  };

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      // Order statuses
      WAITING: { label: 'Изчакване', className: 'bg-yellow-100 text-yellow-800' },
      IN_PROGRESS: { label: 'В процес', className: 'bg-blue-100 text-blue-800' },
      READY: { label: 'Готова за плащане', className: 'bg-green-100 text-green-800' },
      COMPLETED: { label: 'Платена', className: 'bg-gray-100 text-gray-800' },
      CANCELLED: { label: 'Отказана', className: 'bg-red-100 text-red-800' },
      // Schedule statuses
      SCHEDULED: { label: 'Планирана', className: 'bg-blue-100 text-blue-800' },
      DELAYED: { label: 'Забавена', className: 'bg-orange-100 text-orange-800' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // Priority badge helper
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

  // Format time helper
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
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

  const { worker, statistics, activeOrders, todaySchedule, upcomingSchedule } = dashboardData;

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-textPrimary">Начало</h1>
            <p className="text-textSecondary mt-1">
              Добре дошъл, {worker.name}
              {worker.specialization && ` • ${worker.specialization}`}
            </p>
          </div>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-white border border-borderSubtle rounded-lg hover:bg-gray-50 text-sm font-medium text-textSecondary"
          >
            Обнови
          </button>
        </div>

        {/* ==================== СЕКЦИЯ 1: Статистики ==================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => navigate('/mechanic/orders')}
            className="cursor-pointer transform hover:scale-105 transition-transform"
          >
            <StatsCard
              icon={ClipboardList}
              label="Активни поръчки"
              value={statistics.activeOrders}
              subtitle="Кликни за преглед"
            />
          </div>

          <div
            onClick={() => navigate('/mechanic/schedule')}
            className="cursor-pointer transform hover:scale-105 transition-transform"
          >
            <StatsCard
              icon={Calendar}
              label="Днешни задачи"
              value={statistics.todayTasks}
              subtitle="От графика"
            />
          </div>

          <StatsCard
            icon={CheckCircle2}
            label="Завършени поръчки"
            value={statistics.completedOrders}
            subtitle={`Общо ${statistics.totalOrders}`}
          />
        </div>

        {/* ==================== СЕКЦИЯ 2: Активни поръчки ==================== */}
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card">
          <div className="p-6 border-b border-borderSubtle">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-textPrimary">Активни поръчки</h2>
              <button
                onClick={() => navigate('/mechanic/orders')}
                className="text-primary hover:text-primary-700 text-sm font-medium flex items-center gap-1"
              >
                Виж всички
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {activeOrders.length === 0 ? (
              <div className="text-center py-12 text-textSecondary">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Няма активни поръчки</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-borderSubtle">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Клиент
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Автомобил
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Описание
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Приоритет
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Действие
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderSubtle">
                  {activeOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/mechanic/orders/${order.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-textSecondary" />
                          <div>
                            <div className="text-sm font-medium text-textPrimary">
                              {order.client.firstName} {order.client.lastName}
                            </div>
                            {order.client.phone && (
                              <div className="text-xs text-textSecondary flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {order.client.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4">
                        <div className="text-sm text-textPrimary max-w-xs truncate">
                          {order.description || 'Няма описание'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getPriorityBadge(order.priority)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
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
            )}
          </div>
        </div>

        {/* ==================== СЕКЦИЯ 3 & 4: График (2 колони) ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Днешен график */}
          <div className="bg-white rounded-2xl border border-borderSubtle shadow-card">
            <div className="p-6 border-b border-borderSubtle">
              <h2 className="text-xl font-semibold text-textPrimary">Днешен график</h2>
            </div>
            <div className="p-6">
              {todaySchedule.length === 0 ? (
                <div className="text-center py-8 text-textSecondary">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Няма задачи за днес</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {todaySchedule.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 bg-gray-50 rounded-lg border border-borderSubtle hover:border-primary cursor-pointer transition-colors"
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-textPrimary">
                            {formatTime(task.startTime)} - {formatTime(task.endTime)}
                          </span>
                        </div>
                        {getStatusBadge(task.status)}
                      </div>
                      <h3 className="text-sm font-semibold text-textPrimary mb-1">{task.title}</h3>
                      {task.description && (
                        <p className="text-xs text-textSecondary mb-2">{task.description}</p>
                      )}
                      {task.order && (
                        <div className="text-xs text-primary font-medium">
                          Поръчка: {task.order.displayOrderNumber || task.order.orderNumber}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Предстоящи задачи */}
          <div className="bg-white rounded-2xl border border-borderSubtle shadow-card">
            <div className="p-6 border-b border-borderSubtle">
              <h2 className="text-xl font-semibold text-textPrimary">Предстоящи задачи</h2>
            </div>
            <div className="p-6">
              {upcomingSchedule.length === 0 ? (
                <div className="text-center py-8 text-textSecondary">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Няма предстоящи задачи</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {upcomingSchedule.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="p-4 bg-gray-50 rounded-lg border border-borderSubtle hover:border-primary cursor-pointer transition-colors"
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-xs text-textSecondary">{formatDate(task.startTime)}</div>
                        {getStatusBadge(task.status)}
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-textPrimary">
                          {formatTime(task.startTime)} - {formatTime(task.endTime)}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-textPrimary mb-1">{task.title}</h3>
                      {task.order && (
                        <div className="text-xs text-primary font-medium">
                          Поръчка: {task.order.displayOrderNumber || task.order.orderNumber}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal за детайли на задача */}
      <ScheduleDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        schedule={selectedTask}
      />
    </MainLayout>
  );
};

export default MechanicDashboard;
