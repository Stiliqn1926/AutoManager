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
        toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° Ð´Ð½ÐµÐ²ÐµÐ½ Ð³Ñ€Ð°Ñ„Ð¸Ðº');
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
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/admin/schedules')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors w-fit"
            aria-label="ÐÐ°Ð·Ð°Ð´ ÐºÑŠÐ¼ Ð³Ñ€Ð°Ñ„Ð¸Ðº"
            title="ÐÐ°Ð·Ð°Ð´ ÐºÑŠÐ¼ Ð³Ñ€Ð°Ñ„Ð¸Ðº"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>

          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">
              Ð”Ð½ÐµÐ²ÐµÐ½ Ð“Ñ€Ð°Ñ„Ð¸Ðº
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

          <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
            <Button variant="secondary" onClick={goToPreviousDay}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="secondary" onClick={goToToday} className="w-full sm:w-auto">
              Ð”Ð½ÐµÑ
            </Button>
            <Button variant="secondary" onClick={goToNextDay}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button onClick={() => navigate('/admin/schedules/create')} className="w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Ð”Ð¾Ð±Ð°Ð²Ð¸ Ð·Ð°Ð´Ð°Ñ‡Ð°
            </Button>
          </div>
        </div>

        <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
          <div className="border border-borderSubtle rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-mainBg">
                <tr>
                  <th className="w-20 sm:w-24 py-2 px-3 sm:py-3 sm:px-4 text-left text-xs sm:text-sm font-semibold border-r">
                    Ð§Ð°Ñ
                  </th>
                  <th className="py-2 px-3 sm:py-3 sm:px-4 text-left text-xs sm:text-sm font-semibold">
                    Ð—Ð°Ð´Ð°Ñ‡Ð¸
                  </th>
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((timeSlot, index) => {
                  const slotSchedules = getSchedulesForTimeSlot(timeSlot);

                  return (
                    <tr key={index} className="border-t">
                      <td className="py-3 px-3 sm:py-4 sm:px-4 text-xs sm:text-sm border-r align-top">
                        {timeSlot}
                      </td>
                      <td className="py-2 px-3 sm:px-4 relative">
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
                                className={`schedule-item p-2 sm:p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(
                                  schedule.priority
                                )}`}
                              >
                                <p className="font-semibold text-xs sm:text-sm">
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



