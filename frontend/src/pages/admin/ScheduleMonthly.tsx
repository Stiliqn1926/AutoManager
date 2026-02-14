import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
}

interface Schedule {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  priority: string;
  worker: Worker | null;
}

const ScheduleMonthly = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMonthlySchedule = async () => {
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const response = await api.get('/schedules/monthly', {
          params: { year, month },
        });
        setSchedules(response.data.schedules || []);
      } catch {
        toast.error('Грешка при зареждане на месечен график');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMonthlySchedule();
  }, [currentDate]);

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Генерира дните на месеца
  const generateCalendarDays = (): Date[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Първи ден на месеца
    const firstDay = new Date(year, month, 1);

    // Започни от понеделник преди първи ден
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - daysToSubtract);

    // Генерирай 42 дни (6 седмици)
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }

    return days;
  };

  const getSchedulesForDay = (day: Date): Schedule[] => {
    return schedules.filter((schedule) => {
      const scheduleDate = new Date(schedule.startTime);
      return (
        scheduleDate.getDate() === day.getDate() &&
        scheduleDate.getMonth() === day.getMonth() &&
        scheduleDate.getFullYear() === day.getFullYear()
      );
    });
  };

  const isToday = (day: Date): boolean => {
    const today = new Date();
    return (
      day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (day: Date): boolean => {
    return day.getMonth() === currentDate.getMonth();
  };

  const getPriorityColor = (priority: string): string => {
    const colors = {
      LOW: 'schedule-priority-low',
      NORMAL: 'schedule-priority-normal',
      HIGH: 'schedule-priority-high',
      URGENT: 'schedule-priority-urgent',
    };
    return colors[priority as keyof typeof colors] || 'schedule-priority-low';
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Пон', 'Вто', 'Сря', 'Чет', 'Пет', 'Съб', 'Нед'];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/admin/schedules')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors w-fit"
            aria-label="Назад към график"
            title="Назад към график"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>

          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">Месечен График</h1>
            <p className="text-textSecondary mt-1">
              {currentDate.toLocaleDateString('bg-BG', {
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
            <Button variant="secondary" onClick={goToPreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="secondary" onClick={goToToday} className="w-full sm:w-auto">
              Днес
            </Button>
            <Button variant="secondary" onClick={goToNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button onClick={() => navigate('/admin/schedules/create')} className="w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Добави задача
            </Button>
          </div>
        </div>

        <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
          {/* Header със седмичните дни */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-[11px] sm:text-sm text-textSecondary py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Календарна мрежа */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((day, index) => {
              const daySchedules = getSchedulesForDay(day);
              const isCurrentDay = isToday(day);
              const isThisMonth = isCurrentMonth(day);

              return (
                <div
                  key={index}
                  className={`min-h-[96px] sm:min-h-[120px] border rounded-lg p-2 ${
                    isCurrentDay
                      ? 'border-primary bg-mainBg'
                      : 'border-borderSubtle bg-cardBg'
                  } ${!isThisMonth ? 'opacity-40' : ''}`}
                >
                  <div
                    className={`text-xs sm:text-sm font-semibold mb-1 sm:mb-2 ${
                      isCurrentDay ? 'text-primary' : 'text-textSecondary'
                    }`}
                  >
                    {day.getDate()}
                  </div>
                  <div className="space-y-1 max-h-20 sm:max-h-24 overflow-y-auto pr-1">
                    {daySchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        onClick={() => navigate(`/admin/schedules/${schedule.id}`)}
                        className={`text-[11px] sm:text-xs p-1 rounded border-l-2 cursor-pointer hover:shadow-sm transition-shadow ${getPriorityColor(
                          schedule.priority
                        )}`}
                      >
                        <p className="font-medium truncate">{schedule.title}</p>
                        <p className="text-[10px] opacity-75 sm:text-[11px]">
                          {new Date(schedule.startTime).toLocaleTimeString('bg-BG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ScheduleMonthly;



