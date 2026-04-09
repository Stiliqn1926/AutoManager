import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
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
import { POLLING_INTERVALS } from '../../config/polling';

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
  const activeRequestRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);

  const handleTaskClick = (task: ScheduleTaskForModal) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const fetchDashboard = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;

    activeRequestRef.current?.abort();
    const controller = new AbortController();
    activeRequestRef.current = controller;

    if (!silent) {
      setIsLoading(true);
    }

    try {
      const data = await getMechanicDashboard(controller.signal);

      if (requestSeq !== requestSeqRef.current) {
        return;
      }

      setDashboardData(data);
    } catch (error: unknown) {
      if (
        axios.isCancel(error) ||
        (error instanceof Error && error.name === 'AbortError')
      ) {
        return;
      }

      if (!silent) {
        toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° Ð´Ð°Ð½Ð½Ð¸');
      }
    } finally {
      if (requestSeq !== requestSeqRef.current) {
        return;
      }

      if (!silent) {
        setIsLoading(false);
      }

      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();

    const refreshSilently = () => {
      if (document.visibilityState === 'visible') {
        void fetchDashboard({ silent: true });
      }
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchDashboard({ silent: true });
      }
    }, POLLING_INTERVALS.dashboard);

    window.addEventListener('focus', refreshSilently);
    document.addEventListener('visibilitychange', refreshSilently);

    return () => {
      activeRequestRef.current?.abort();
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshSilently);
      document.removeEventListener('visibilitychange', refreshSilently);
    };
  }, [fetchDashboard]);

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      // Order statuses
      WAITING: { label: 'Ð˜Ð·Ñ‡Ð°ÐºÐ²Ð°Ð½Ðµ', className: 'bg-yellow-100 text-yellow-800' },
      IN_PROGRESS: { label: 'Ð’ Ð¿Ñ€Ð¾Ñ†ÐµÑ', className: 'bg-blue-100 text-blue-800' },
      READY: { label: 'Ð“Ð¾Ñ‚Ð¾Ð²Ð° Ð·Ð° Ð¿Ð»Ð°Ñ‰Ð°Ð½Ðµ', className: 'bg-green-100 text-green-800' },
      COMPLETED: { label: 'ÐŸÐ»Ð°Ñ‚ÐµÐ½Ð°', className: 'bg-gray-100 text-gray-800' },
      CANCELLED: { label: 'ÐžÑ‚ÐºÐ°Ð·Ð°Ð½Ð°', className: 'bg-red-100 text-red-800' },
      // Schedule statuses
      SCHEDULED: { label: 'ÐŸÐ»Ð°Ð½Ð¸Ñ€Ð°Ð½Ð°', className: 'bg-blue-100 text-blue-800' },
      DELAYED: { label: 'Ð—Ð°Ð±Ð°Ð²ÐµÐ½Ð°', className: 'bg-orange-100 text-orange-800' },
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
      LOW: { label: 'ÐÐ¸ÑÑŠÐº', className: 'bg-gray-100 text-gray-600' },
      NORMAL: { label: 'ÐÐ¾Ñ€Ð¼Ð°Ð»ÐµÐ½', className: 'bg-blue-100 text-blue-700' },
      MEDIUM: { label: 'Ð¡Ñ€ÐµÐ´ÐµÐ½', className: 'bg-blue-100 text-blue-700' },
      HIGH: { label: 'Ð’Ð¸ÑÐ¾Ðº', className: 'bg-orange-100 text-orange-700' },
      URGENT: { label: 'Ð¡Ð¿ÐµÑˆÐµÐ½', className: 'bg-red-100 text-red-700' },
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
          <p className="text-textSecondary mb-4">Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° Ð´Ð°Ð½Ð½Ð¸</p>
          <button
            onClick={() => void fetchDashboard()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700"
          >
            ÐžÐ¿Ð¸Ñ‚Ð°Ð¹ Ð¾Ñ‚Ð½Ð¾Ð²Ð¾
          </button>
        </div>
      </MainLayout>
    );
  }

  const { worker, statistics, activeOrders, todaySchedule, upcomingSchedule } = dashboardData;

  return (
    <MainLayout>
      <div className="space-y-5 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">ÐÐ°Ñ‡Ð°Ð»Ð¾</h1>
            <p className="text-textSecondary mt-1">
              Ð”Ð¾Ð±Ñ€Ðµ Ð´Ð¾ÑˆÑŠÐ», {worker.name}
              {worker.specialization && ` â€¢ ${worker.specialization}`}
            </p>
          </div>
          <button
            onClick={() => void fetchDashboard()}
            className="w-full sm:w-auto sm:ml-auto px-4 py-2 bg-cardBg border border-borderSubtle rounded-lg hover:bg-mainBg text-sm font-medium text-textSecondary"
          >
            ÐžÐ±Ð½Ð¾Ð²Ð¸
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div
            onClick={() => navigate('/mechanic/orders')}
            className="cursor-pointer transform hover:scale-105 transition-transform"
          >
            <StatsCard
              icon={ClipboardList}
              label="ÐÐºÑ‚Ð¸Ð²Ð½Ð¸ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ¸"
              value={statistics.activeOrders}
              subtitle="ÐšÐ»Ð¸ÐºÐ½Ð¸ Ð·Ð° Ð¿Ñ€ÐµÐ³Ð»ÐµÐ´"
            />
          </div>

          <div
            onClick={() => navigate('/mechanic/schedule')}
            className="cursor-pointer transform hover:scale-105 transition-transform"
          >
            <StatsCard
              icon={Calendar}
              label="Ð”Ð½ÐµÑˆÐ½Ð¸ Ð·Ð°Ð´Ð°Ñ‡Ð¸"
              value={statistics.todayTasks}
              subtitle="ÐžÑ‚ Ð³Ñ€Ð°Ñ„Ð¸ÐºÐ°"
            />
          </div>

          <StatsCard
            icon={CheckCircle2}
            label="Ð—Ð°Ð²ÑŠÑ€ÑˆÐµÐ½Ð¸ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ¸"
            value={statistics.completedOrders}
            subtitle={`ÐžÐ±Ñ‰Ð¾ ${statistics.totalOrders}`}
          />
        </div>

        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card">
          <div className="p-4 sm:p-6 border-b border-borderSubtle">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">ÐÐºÑ‚Ð¸Ð²Ð½Ð¸ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ¸</h2>
              <button
                onClick={() => navigate('/mechanic/orders')}
                className="text-primary hover:text-primary-700 text-sm font-medium flex items-center gap-1 sm:ml-auto"
              >
                Ð’Ð¸Ð¶ Ð²ÑÐ¸Ñ‡ÐºÐ¸
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {activeOrders.length === 0 ? (
              <div className="text-center py-12 text-textSecondary">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>ÐÑÐ¼Ð° Ð°ÐºÑ‚Ð¸Ð²Ð½Ð¸ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ¸</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-borderSubtle">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      ÐšÐ»Ð¸ÐµÐ½Ñ‚
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      ÐÐ²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸Ðµ
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Ð¡Ñ‚Ð°Ñ‚ÑƒÑ
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      ÐŸÑ€Ð¸Ð¾Ñ€Ð¸Ñ‚ÐµÑ‚
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Ð”ÐµÐ¹ÑÑ‚Ð²Ð¸Ðµ
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
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base whitespace-nowrap">
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
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base whitespace-nowrap">
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
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base">
                        <div className="text-sm text-textPrimary max-w-xs truncate">
                          {order.description || 'ÐÑÐ¼Ð° Ð¾Ð¿Ð¸ÑÐ°Ð½Ð¸Ðµ'}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base whitespace-nowrap">{getStatusBadge(order.status)}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base whitespace-nowrap">{getPriorityBadge(order.priority)}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/mechanic/orders/${order.id}`);
                          }}
                          className="text-primary hover:text-primary-700 text-sm font-medium"
                        >
                          ÐžÑ‚Ð²Ð¾Ñ€Ð¸
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          <div className="bg-white rounded-2xl border border-borderSubtle shadow-card">
            <div className="p-4 sm:p-6 border-b border-borderSubtle">
              <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">Ð”Ð½ÐµÑˆÐµÐ½ Ð³Ñ€Ð°Ñ„Ð¸Ðº</h2>
            </div>
            <div className="p-4 sm:p-6">
              {todaySchedule.length === 0 ? (
                <div className="text-center py-8 text-textSecondary">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>ÐÑÐ¼Ð° Ð·Ð°Ð´Ð°Ñ‡Ð¸ Ð·Ð° Ð´Ð½ÐµÑ</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {todaySchedule.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-borderSubtle hover:border-primary cursor-pointer transition-colors"
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
                          ÐŸÐ¾Ñ€ÑŠÑ‡ÐºÐ°: {task.order.displayOrderNumber || task.order.orderNumber}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-borderSubtle shadow-card">
            <div className="p-4 sm:p-6 border-b border-borderSubtle">
              <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">ÐŸÑ€ÐµÐ´ÑÑ‚Ð¾ÑÑ‰Ð¸ Ð·Ð°Ð´Ð°Ñ‡Ð¸</h2>
            </div>
            <div className="p-4 sm:p-6">
              {upcomingSchedule.length === 0 ? (
                <div className="text-center py-8 text-textSecondary">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>ÐÑÐ¼Ð° Ð¿Ñ€ÐµÐ´ÑÑ‚Ð¾ÑÑ‰Ð¸ Ð·Ð°Ð´Ð°Ñ‡Ð¸</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {upcomingSchedule.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-borderSubtle hover:border-primary cursor-pointer transition-colors"
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
                          ÐŸÐ¾Ñ€ÑŠÑ‡ÐºÐ°: {task.order.displayOrderNumber || task.order.orderNumber}
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

      <ScheduleDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        schedule={selectedTask}
      />
    </MainLayout>
  );
};

export default MechanicDashboard;


