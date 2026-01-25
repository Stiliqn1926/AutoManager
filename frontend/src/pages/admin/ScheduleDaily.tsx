import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';
import '../../styles/schedule.css';

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

const ScheduleDaily = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDailySchedule = async () => {
      try {
        const dateISO = currentDate.toISOString().split('T')[0];
        const response = await api.get('/schedules/daily', {
          params: { date: dateISO },
        });
        setSchedules(response.data.schedules || []);
      } catch {
        toast.error('Грешка при зареждане на дневен график');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDailySchedule();
  }, [currentDate]);

  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Генерира часови слотове (08:00 – 18:00)
  const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    for (let hour = 8; hour <= 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const getSchedulesForTimeSlot = (hour: string): Schedule[] => {
    const [slotHour] = hour.split(':').map(Number);

    return schedules.filter((schedule) => {
      const start = new Date(schedule.startTime);
      return slotHour === start.getHours();
    });
  };

  const getPriorityColor = (priority: string): string => {
    const colors = {
      LOW: 'bg-gray-100 border-gray-400 text-gray-800',
      NORMAL: 'bg-blue-100 border-blue-400 text-blue-800',
      HIGH: 'bg-orange-100 border-orange-400 text-orange-800',
      URGENT: 'bg-red-100 border-red-400 text-red-800',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100';
  };

  const timeSlots = generateTimeSlots();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/schedules')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Назад към график"
            title="Назад към график"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-textPrimary">
              Дневен График
            </h1>
            <p className="text-textSecondary mt-1">
              {currentDate.toLocaleDateString('bg-BG', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={goToPreviousDay}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="secondary" onClick={goToToday}>
              Днес
            </Button>
            <Button variant="secondary" onClick={goToNextDay}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button onClick={() => navigate('/admin/schedules/create')}>
              <Plus className="w-4 h-4" />
              Добави задача
            </Button>
          </div>
        </div>

        <div className="bg-cardBg rounded-2xl shadow-card p-6">
          <div className="border border-borderSubtle rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-mainBg">
                <tr>
                  <th className="w-24 py-3 px-4 text-left text-sm font-semibold border-r">
                    Час
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">
                    Задачи
                  </th>
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((timeSlot, index) => {
                  const slotSchedules = getSchedulesForTimeSlot(timeSlot);

                  return (
                    <tr key={index} className="border-t">
                      <td className="py-4 px-4 text-sm border-r align-top">
                        {timeSlot}
                      </td>
                      <td className="py-2 px-4 relative">
                        {slotSchedules.length > 0 && (
                          <div className="flex flex-col gap-2">
                            {slotSchedules.map((schedule) => (
                              <div
                                key={schedule.id}
                                onClick={() =>
                                  navigate(
                                    `/admin/schedules/${schedule.id}`
                                  )
                                }
                                className={`schedule-item p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(
                                  schedule.priority
                                )}`}
                              >
                                <p className="font-semibold text-sm">
                                  {schedule.title}
                                </p>
                                <p className="text-xs mt-1">
                                  {new Date(
                                    schedule.startTime
                                  ).toLocaleTimeString('bg-BG', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}{' '}
                                  -{' '}
                                  {new Date(
                                    schedule.endTime
                                  ).toLocaleTimeString('bg-BG', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                                {schedule.worker && (
                                  <p className="text-xs mt-1">
                                    {schedule.worker.firstName}{' '}
                                    {schedule.worker.lastName}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ScheduleDaily;
