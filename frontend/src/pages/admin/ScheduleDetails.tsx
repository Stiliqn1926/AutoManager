import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, User, Calendar, FileText, AlertCircle } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface Order {
  id: string;
  orderNumber: string;
  displayOrderNumber?: string | null;
  client: {
    firstName: string;
    lastName: string;
  };
  vehicle: {
    brand: string;
    model: string;
    licensePlate: string;
  };
}

interface Schedule {
  id: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  priority: string;
  estimatedDuration: number | null;
  notes: string | null;
  isCompleted: boolean;
  worker: Worker | null;
  order: Order | null;
  createdAt: string;
  updatedAt: string;
}

const ScheduleDetails = () => {
  const { id } = useParams();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await api.get(`/schedules/${id}`);
        setSchedule(response.data.schedule);
      } catch {
        toast.error('Грешка при зареждане на задача');
        navigate('/admin/schedules');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!schedule) return;
    if (!confirm(`Сигурни ли сте, че искате да изтриете задача "${schedule.title}"?`)) return;

    try {
      await api.delete(`/schedules/${id}`);
      toast.success('Задачата е изтрита');
      navigate('/admin/schedules');
    } catch {
      toast.error('Грешка при изтриване');
    }
  };

  const handleComplete = async () => {
    if (!schedule) return;

    try {
      await api.patch(`/schedules/${id}/complete`);
      toast.success('Задачата е маркирана като завършена');
      const response = await api.get(`/schedules/${id}`);
      setSchedule(response.data.schedule);
    } catch {
      toast.error('Грешка при обновяване');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      SCHEDULED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      READY: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      DELAYED: 'bg-orange-100 text-orange-800',
    };
    const labels = {
      SCHEDULED: 'Планирана',
      IN_PROGRESS: 'В процес',
      READY: 'Готова за плащане',
      COMPLETED: 'Платена',
      CANCELLED: 'Отменена',
      DELAYED: 'Забавена',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      LOW: 'bg-gray-100 text-gray-800',
      NORMAL: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800',
    };
    const labels = {
      LOW: 'Нисък',
      NORMAL: 'Нормален',
      HIGH: 'Висок',
      URGENT: 'Спешен',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[priority as keyof typeof styles]}`}>
        {labels[priority as keyof typeof labels]}
      </span>
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!schedule) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-textSecondary">Задачата не е намерена</p>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">{schedule.title}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {getStatusBadge(schedule.status)}
              {getPriorityBadge(schedule.priority)}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {!schedule.isCompleted && schedule.status !== 'COMPLETED' && (
              <Button onClick={handleComplete} className="w-full sm:w-auto">
                Маркирай като завършена
              </Button>
            )}
            {schedule.status !== 'COMPLETED' && (
              <Button onClick={() => navigate(`/admin/schedules/${id}/edit`)} className="w-full sm:w-auto">
                <Edit className="w-4 h-4" />
                Редактирай
              </Button>
            )}
            <Button variant="danger" onClick={handleDelete} className="w-full sm:w-auto">
              <Trash2 className="w-4 h-4" />
              Изтрий
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {schedule.worker && (
              <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Механик
                </h2>
                <div
                  onClick={() => navigate(`/admin/workers/${schedule.worker!.id}`)}
                  className="p-3 sm:p-4 bg-mainBg rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <p className="font-medium text-textPrimary">
                    {schedule.worker.firstName} {schedule.worker.lastName}
                  </p>
                  <p className="text-sm text-textSecondary mt-1">{schedule.worker.phone}</p>
                </div>
              </div>
            )}

            
            {schedule.order && (
              <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Свързана поръчка
                </h2>
                <div
                  onClick={() => navigate(`/admin/orders/${schedule.order!.id}`)}
                  className="p-3 sm:p-4 bg-mainBg rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <p className="font-medium text-textPrimary">{schedule.order.displayOrderNumber || schedule.order.orderNumber}</p>
                  <p className="text-sm text-textSecondary mt-1">
                    Клиент: {schedule.order.client.firstName} {schedule.order.client.lastName}
                  </p>
                  <p className="text-sm text-textSecondary">
                    Автомобил: {schedule.order.vehicle.brand} {schedule.order.vehicle.model} ({schedule.order.vehicle.licensePlate})
                  </p>
                </div>
              </div>
            )}

            
            <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Описание и бележки
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {schedule.description && (
                  <div>
                    <p className="text-sm font-medium text-textSecondary mb-2">Описание:</p>
                    <p className="text-textPrimary bg-mainBg p-3 rounded-lg">
                      {schedule.description}
                    </p>
                  </div>
                )}
                {schedule.notes && (
                  <div>
                    <p className="text-sm font-medium text-textSecondary mb-2">Бележки:</p>
                    <p className="text-textPrimary bg-mainBg p-3 rounded-lg">{schedule.notes}</p>
                  </div>
                )}
                {!schedule.description && !schedule.notes && (
                  <p className="text-textSecondary">Няма описание или бележки</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            
            <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Време и дата
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-textSecondary">Дата</p>
                  <p className="font-medium text-textPrimary">
                    {new Date(schedule.date).toLocaleDateString('bg-BG', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-textSecondary">Време</p>
                  <p className="font-medium text-textPrimary">
                    {new Date(schedule.startTime).toLocaleTimeString('bg-BG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {new Date(schedule.endTime).toLocaleTimeString('bg-BG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {schedule.estimatedDuration && (
                  <div>
                    <p className="text-sm text-textSecondary">Очаквана продължителност</p>
                    <p className="font-medium text-textPrimary">{schedule.estimatedDuration} минути</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-textSecondary">Създадена на</p>
                  <p className="font-medium text-textPrimary">
                    {new Date(schedule.createdAt).toLocaleString('bg-BG')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ScheduleDetails;


