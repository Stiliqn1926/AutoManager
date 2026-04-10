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

interface Order {
  id: string;
  orderNumber: string;
}

interface Schedule {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  priority: string;
  worker: Worker | null;
  order: Order | null;
}

const ScheduleWeekly = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

 useEffect(() => {
  const fetchWeeklySchedule = async () => {
    try {
      const weekStartISO = currentWeekStart.toISOString();
      const response = await api.get('/schedules/weekly', {
        params: { weekStart: weekStartISO },
      });
      setSchedules(response.data.schedules || []);
    } catch {
      toast.error('Грешка при зареждане на седмичен график');
    } finally {
      setIsLoading(false);
    }
  };

  fetchWeeklySchedule();
}, [currentWeekStart]);

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const getWeekDays = (): Date[] => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getSchedulesForDay = (date: Date): Schedule[] => {
    return schedules.filter((schedule) => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate.toDateString() === date.toDateString();
    });
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

  const weekDays = getWeekDays();
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

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
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">Седмичен График</h1>
            <p className="text-textSecondary mt-1">
              {currentWeekStart.toLocaleDateString('bg-BG', { day: 'numeric', month: 'long' })} -{' '}
              {weekEnd.toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
            <Button variant="secondary" onClick={goToPreviousWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="secondary" onClick={goToToday} className="w-full sm:w-auto">
              Днес
            </Button>
            <Button variant="secondary" onClick={goToNextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button onClick={() => navigate('/admin/schedules/create')} className="w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Добави задача
            </Button>
          </div>
        </div>

        <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-4">
            {weekDays.map((day, index) => {
              const daySchedules = getSchedulesForDay(day);
              const isToday = day.toDateString() === new Date().toDateString();
              const dayNames = ['Пон', 'Вто', 'Сря', 'Чет', 'Пет', 'Съб', 'Нед'];

              return (
                <div
                  key={index}
                  className={`border rounded-lg p-3 min-h-[180px] sm:min-h-64 ${
                    isToday ? 'border-primary bg-mainBg' : 'border-borderSubtle'
                  }`}
                >
                  <div className="text-center mb-3">
                    <p className="text-xs text-textSecondary font-medium">{dayNames[index]}</p>
                    <p
                      className={`text-base sm:text-lg font-bold ${
                        isToday ? 'text-primary' : 'text-textPrimary'
                      }`}
                    >
                      {day.getDate()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {daySchedules.length > 0 ? (
                      daySchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          onClick={() => navigate(`/admin/schedules/${schedule.id}`)}
                          className={`p-2 rounded border-l-4 cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(
                            schedule.priority
                          )}`}
                        >
                          <p className="text-xs font-semibold truncate">
                            {schedule.title}
                          </p>
                          <p className="text-xs mt-1 opacity-80">
                            {new Date(schedule.startTime).toLocaleTimeString('bg-BG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          {schedule.worker && (
                            <p className="text-xs truncate opacity-80">
                              {schedule.worker.firstName} {schedule.worker.lastName}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-textSecondary text-center mt-8">Няма задачи</p>
                    )}
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

export default ScheduleWeekly;

