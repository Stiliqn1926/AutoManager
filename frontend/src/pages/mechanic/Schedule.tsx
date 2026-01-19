import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Car,
  User,
  FileText,
  X,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import {
  getMechanicDailySchedule,
  getMechanicWeeklySchedule,
  getMechanicMonthlySchedule,
  getMechanicScheduleById,
} from '../../services/mechanicService';
import type { MechanicScheduleItem, MechanicScheduleDetails } from '../../types/mechanic';
import toast from 'react-hot-toast';

type ViewType = 'daily' | 'weekly' | 'monthly';

const MechanicSchedule = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewType>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<MechanicScheduleItem[]>([]);
  const [todaySchedules, setTodaySchedules] = useState<MechanicScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<MechanicScheduleDetails | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchSchedules = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      let data;

      if (view === 'daily') {
        const dateStr = currentDate.toISOString().split('T')[0];
        data = await getMechanicDailySchedule(dateStr, signal);
      } else if (view === 'weekly') {
        const weekStart = getWeekStart(currentDate);
        const weekStartStr = weekStart.toISOString().split('T')[0];
        data = await getMechanicWeeklySchedule(weekStartStr);
      } else {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        data = await getMechanicMonthlySchedule(year, month);
      }

      setSchedules(data.schedules);
    } catch (error: unknown) {
      // Ignore cancel/abort errors (component unmounted or request cancelled)
      if (axios.isCancel(error) || (error instanceof Error && error.name === 'AbortError')) {
        return;
      }
      toast.error('Грешка при зареждане на график');
    } finally {
      setIsLoading(false);
    }
  }, [view, currentDate]);

  const fetchTodaySchedules = useCallback(async (signal?: AbortSignal) => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const data = await getMechanicDailySchedule(todayStr, signal);
      setTodaySchedules(data.schedules);
    } catch (error: unknown) {
      // Ignore abort errors (component unmounted)
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      // Silent fail for today section for other errors
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchSchedules(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchSchedules]);

  useEffect(() => {
    const controller = new AbortController();
    fetchTodaySchedules(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchTodaySchedules]);

  const handleScheduleClick = async (scheduleId: string) => {
    try {
      const data = await getMechanicScheduleById(scheduleId);
      setSelectedSchedule(data.schedule);
      setShowModal(true);
    } catch {
      toast.error('Грешка при зареждане на детайли');
    }
  };

  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);

    if (view === 'daily') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (view === 'weekly') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }

    setCurrentDate(newDate);
  };

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      LOW: 'bg-green-100 text-green-800 border-green-300',
      NORMAL: 'bg-blue-100 text-blue-800 border-blue-300',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
      URGENT: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[priority] || colors.NORMAL;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      SCHEDULED: { label: 'Планиран', className: 'bg-blue-100 text-blue-800' },
      IN_PROGRESS: { label: 'В процес', className: 'bg-yellow-100 text-yellow-800' },
      COMPLETED: { label: 'Завършен', className: 'bg-green-100 text-green-800' },
      CANCELLED: { label: 'Отменен', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getDateLabel = (): string => {
    if (view === 'daily') {
      return currentDate.toLocaleDateString('bg-BG', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } else if (view === 'weekly') {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${weekStart.toLocaleDateString('bg-BG', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('bg-BG', { month: 'long', year: 'numeric' });
    }
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Add days from previous month
    const firstDayOfWeek = firstDay.getDay();
    const daysFromPrevMonth = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    for (let i = daysFromPrevMonth; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push(d);
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const getSchedulesForDate = (date: Date): MechanicScheduleItem[] => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter((s) => s.date.split('T')[0] === dateStr);
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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-textPrimary">График</h1>
          <p className="text-textSecondary mt-1">Личен работен график</p>
        </div>

        {/* TODAY SECTION */}
        {todaySchedules.length > 0 && (
          <div className="bg-primary-50 rounded-2xl border-2 border-primary shadow-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-textPrimary">Днешни задачи</h2>
            </div>
            <div className="space-y-3">
              {todaySchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  onClick={() => handleScheduleClick(schedule.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(schedule.priority)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                          {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                        </span>
                      </div>
                      <h3 className="text-base font-bold mb-1">{schedule.title}</h3>
                      {schedule.order && (
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-1">
                            <Car className="w-3 h-3" />
                            <span>
                              {schedule.order.vehicle.brand} {schedule.order.vehicle.model} (
                              {schedule.order.vehicle.licensePlate})
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>
                              {schedule.order.client.firstName} {schedule.order.client.lastName}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    {getStatusBadge(schedule.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Controls */}
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            {/* View Switcher */}
            <div className="flex gap-2">
              <button
                onClick={() => setView('daily')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'daily'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-textSecondary hover:bg-gray-200'
                }`}
              >
                Дневен
              </button>
              <button
                onClick={() => setView('weekly')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'weekly'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-textSecondary hover:bg-gray-200'
                }`}
              >
                Седмичен
              </button>
              <button
                onClick={() => setView('monthly')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'monthly'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-textSecondary hover:bg-gray-200'
                }`}
              >
                Месечен
              </button>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Предишен период"
              >
                <ChevronLeft className="w-5 h-5 text-textSecondary" />
              </button>
              <div className="text-lg font-semibold text-textPrimary min-w-[250px] text-center">
                {getDateLabel()}
              </div>
              <button
                onClick={() => navigateDate('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Следващ период"
              >
                <ChevronRight className="w-5 h-5 text-textSecondary" />
              </button>
            </div>

            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-gray-100 text-textSecondary rounded-lg hover:bg-gray-200 font-medium"
            >
              Днес
            </button>
          </div>

          {/* DAILY VIEW */}
          {view === 'daily' && (
            <div className="space-y-2">
              {schedules.length === 0 ? (
                <div className="text-center py-12 text-textSecondary">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Няма планирани задачи за този ден</p>
                </div>
              ) : (
                schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    onClick={() => handleScheduleClick(schedule.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(schedule.priority)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-semibold">
                            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                          </span>
                          {getStatusBadge(schedule.status)}
                        </div>
                        <h3 className="text-base font-bold mb-1">{schedule.title}</h3>
                        {schedule.description && (
                          <p className="text-sm mb-2">{schedule.description}</p>
                        )}
                        {schedule.order && (
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/mechanic/orders/${schedule.order!.id}`);
                                }}
                                className="text-primary hover:underline font-medium"
                              >
                                Поръчка {schedule.order.orderNumber}
                              </button>
                            </div>
                            <div className="flex items-center gap-1">
                              <Car className="w-3 h-3" />
                              <span>
                                {schedule.order.vehicle.brand} {schedule.order.vehicle.model} (
                                {schedule.order.vehicle.licensePlate})
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>
                                {schedule.order.client.firstName} {schedule.order.client.lastName}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* WEEKLY VIEW */}
          {view === 'weekly' && (
            <div className="grid grid-cols-7 gap-2">
              {['Пон', 'Вто', 'Сря', 'Чет', 'Пет', 'Съб', 'Нед'].map((day) => (
                <div key={day} className="text-center font-semibold text-textSecondary text-sm py-2">
                  {day}
                </div>
              ))}
              {(() => {
                const weekStart = getWeekStart(currentDate);
                const days = Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(weekStart);
                  d.setDate(d.getDate() + i);
                  return d;
                });

                return days.map((day) => {
                  const daySchedules = getSchedulesForDate(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className="min-h-[120px] p-2 border border-borderSubtle rounded-lg bg-gray-50"
                    >
                      <div className="text-sm font-semibold text-textPrimary mb-2">
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {daySchedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            onClick={() => handleScheduleClick(schedule.id)}
                            className={`p-1 rounded text-xs cursor-pointer hover:shadow-sm ${getPriorityColor(schedule.priority)}`}
                          >
                            <div className="font-semibold truncate">{formatTime(schedule.startTime)}</div>
                            <div className="truncate">{schedule.title}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {/* MONTHLY VIEW */}
          {view === 'monthly' && (
            <div>
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Пон', 'Вто', 'Сря', 'Чет', 'Пет', 'Съб', 'Нед'].map((day) => (
                  <div key={day} className="text-center font-semibold text-textSecondary text-sm py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {getDaysInMonth(currentDate).map((day, index) => {
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const daySchedules = getSchedulesForDate(day);
                  const hasSchedules = daySchedules.length > 0;

                  return (
                    <div
                      key={index}
                      className={`min-h-[80px] p-2 border rounded-lg ${
                        isCurrentMonth ? 'bg-white border-borderSubtle' : 'bg-gray-50 border-gray-200'
                      } ${hasSchedules ? 'cursor-pointer hover:shadow-md' : ''}`}
                      onClick={() => {
                        if (hasSchedules && daySchedules[0]) {
                          handleScheduleClick(daySchedules[0].id);
                        }
                      }}
                    >
                      <div
                        className={`text-sm font-semibold mb-1 ${
                          isCurrentMonth ? 'text-textPrimary' : 'text-textSecondary'
                        }`}
                      >
                        {day.getDate()}
                      </div>
                    {hasSchedules && (
  <div className="space-y-1">
    {daySchedules.slice(0, 1).map((schedule) => (
      <div
        key={schedule.id}
        onClick={() => handleScheduleClick(schedule.id)}
        className={`p-1 rounded text-xs cursor-pointer hover:shadow-sm ${getPriorityColor(schedule.priority)}`}
      >
        <div className="font-semibold truncate">{formatTime(schedule.startTime)}</div>
        <div className="truncate">{schedule.title}</div>
      </div>
    ))}
    {daySchedules.length > 1 && (
      <div className="text-xs text-textSecondary text-center mt-1">
        +{daySchedules.length - 1}
      </div>
    )}
  </div>
)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* MODAL - Schedule Details */}
        {showModal && selectedSchedule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-borderSubtle flex items-center justify-between">
                <h3 className="text-xl font-semibold text-textPrimary">Детайли за задачата</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Затвори"
                >
                  <X className="w-5 h-5 text-textSecondary" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Title and Status */}
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-2xl font-bold text-textPrimary">{selectedSchedule.title}</h2>
                    {getStatusBadge(selectedSchedule.status)}
                  </div>
                  {selectedSchedule.description && (
                    <p className="text-base text-textSecondary">{selectedSchedule.description}</p>
                  )}
                </div>

                {/* Time Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-textSecondary mb-1">Дата</div>
                      <div className="font-semibold text-textPrimary">
                        {formatDate(selectedSchedule.date)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-textSecondary mb-1">Време</div>
                      <div className="font-semibold text-textPrimary">
                        {formatTime(selectedSchedule.startTime)} - {formatTime(selectedSchedule.endTime)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Info */}
                {selectedSchedule.order && (
                  <div>
                    <h3 className="text-lg font-semibold text-textPrimary mb-3">Поръчка</h3>
                    <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                      <div>
                        <div className="text-sm text-textSecondary mb-1">Номер на поръчка</div>
                        <button
                          onClick={() => {
                            setShowModal(false);
                            navigate(`/mechanic/orders/${selectedSchedule.order!.id}`);
                          }}
                          className="font-semibold text-primary hover:underline"
                        >
                          {selectedSchedule.order.orderNumber}
                        </button>
                      </div>
                      <div>
                        <div className="text-sm text-textSecondary mb-1">Автомобил</div>
                        <div className="font-semibold text-textPrimary">
                          {selectedSchedule.order.vehicle.brand} {selectedSchedule.order.vehicle.model} (
                          {selectedSchedule.order.vehicle.licensePlate})
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-textSecondary mb-1">Клиент</div>
                        <div className="font-semibold text-textPrimary">
                          {selectedSchedule.order.client.firstName}{' '}
                          {selectedSchedule.order.client.lastName}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedSchedule.notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-textPrimary mb-2">Бележки</h3>
                    <p className="text-base text-textSecondary bg-gray-50 p-4 rounded-lg">
                      {selectedSchedule.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-borderSubtle flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-textPrimary rounded-lg hover:bg-gray-300"
                >
                  Затвори
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default MechanicSchedule;