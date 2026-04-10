import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Schedule {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  worker: {
    firstName: string;
    lastName: string;
  } | null;
}

const UpcomingSchedule = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await api.get('/schedules?limit=5');
        setSchedules(response.data.schedules || []);
      } catch  {
        toast.error('Грешка при зареждане на график');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-cardBg rounded-2xl shadow-card p-6">
        <h2 className="text-lg font-semibold text-textPrimary mb-4">Предстоящи Задачи</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cardBg rounded-2xl shadow-card p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-textPrimary">Предстоящи Задачи</h2>
        <button
          onClick={() => navigate('/admin/schedule')}
          className="text-sm text-primary hover:text-primary-700 font-medium"
        >
          Виж календар →
        </button>
      </div>

      {schedules.length === 0 ? (
        <p className="text-textSecondary text-center py-8">Няма предстоящи задачи</p>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              onClick={() => navigate(`/admin/schedule/${schedule.id}`)}
              className="p-4 bg-mainBg rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-textPrimary">{schedule.title}</p>
                  {schedule.description && (
                    <p className="text-sm text-textSecondary mt-1">{schedule.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-textMuted">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(schedule.startTime).toLocaleString('bg-BG', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    {schedule.worker && (
                      <span>
                        {schedule.worker.firstName} {schedule.worker.lastName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingSchedule;

