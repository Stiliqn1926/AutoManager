import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  membershipStatus?: 'ACTIVE' | 'PENDING' | 'INACTIVE';
}

interface Order {
  id: string;
  orderNumber: string;
  displayOrderNumber?: string | null;
}

interface ScheduleFormData {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  workerId: string;
  orderId: string;
  status: string;
  priority: string;
  estimatedDuration: string;
  notes: string;
}

const ScheduleEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasConflict, setHasConflict] = useState(false);
  const [formData, setFormData] = useState<ScheduleFormData>({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    workerId: '',
    orderId: '',
    status: 'SCHEDULED',
    priority: 'NORMAL',
    estimatedDuration: '',
    notes: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scheduleRes, workersRes, ordersRes] = await Promise.all([
          api.get(`/schedules/${id}`),
          api.get('/workers'),
          api.get('/orders'),
        ]);

        const schedule = scheduleRes.data.schedule;
        
        const scheduleDate = new Date(schedule.date).toISOString().split('T')[0];
        const startTime = new Date(schedule.startTime).toTimeString().slice(0, 5);
        const endTime = new Date(schedule.endTime).toTimeString().slice(0, 5);

        setFormData({
          title: schedule.title,
          description: schedule.description || '',
          date: scheduleDate,
          startTime,
          endTime,
          workerId: schedule.worker?.id || '',
          orderId: schedule.order?.id || '',
          status: schedule.status,
          priority: schedule.priority,
          estimatedDuration: schedule.estimatedDuration?.toString() || '',
          notes: schedule.notes || '',
        });

        const allWorkers = workersRes.data.workers || [];
        const activeWorkers = allWorkers.filter(
          (worker: Worker) =>
            worker.isActive && (worker.membershipStatus ? worker.membershipStatus === 'ACTIVE' : true)
        );
        setWorkers(activeWorkers);
        setOrders(ordersRes.data.orders || []);
      } catch {
        toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° Ð·Ð°Ð´Ð°Ñ‡Ð°');
        navigate('/admin/schedules');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  useEffect(() => {
    const checkForConflicts = async () => {
      if (!formData.workerId || !formData.date || !formData.startTime || !formData.endTime) {
        setHasConflict(false);
        return;
      }

      try {
        const startTime = new Date(`${formData.date}T${formData.startTime}`).toISOString();
        const endTime = new Date(`${formData.date}T${formData.endTime}`).toISOString();

        const response = await api.post('/schedules/check-conflicts', {
          workerId: formData.workerId,
          startTime,
          endTime,
          scheduleId: id,
        });

        setHasConflict(response.data.hasConflict);
        if (response.data.hasConflict) {
          toast.error('ÐšÐ¾Ð½Ñ„Ð»Ð¸ÐºÑ‚: Ð¼ÐµÑ…Ð°Ð½Ð¸ÐºÑŠÑ‚ Ð¸Ð¼Ð° Ð´Ñ€ÑƒÐ³Ð° Ð·Ð°Ð´Ð°Ñ‡Ð° Ð² Ñ‚Ð¾Ð·Ð¸ Ð¿ÐµÑ€Ð¸Ð¾Ð´!');
        }
      } catch {

      }
    };

    const timeoutId = setTimeout(() => {
      checkForConflicts();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [id, formData.workerId, formData.date, formData.startTime, formData.endTime]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (hasConflict) {
      toast.error('ÐÐµ Ð¼Ð¾Ð¶Ðµ Ð´Ð° Ð¾Ð±Ð½Ð¾Ð²Ð¸Ñ‚Ðµ Ð·Ð°Ð´Ð°Ñ‡Ð° Ñ ÐºÐ¾Ð½Ñ„Ð»Ð¸ÐºÑ‚Ð½Ð¾ Ð²Ñ€ÐµÐ¼Ðµ!');
      return;
    }

    setIsSaving(true);

    try {
      const startTime = new Date(`${formData.date}T${formData.startTime}`).toISOString();
      const endTime = new Date(`${formData.date}T${formData.endTime}`).toISOString();

      await api.put(`/schedules/${id}`, {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        startTime,
        endTime,
        workerId: formData.workerId || undefined,
        orderId: formData.orderId || undefined,
        status: formData.status,
        priority: formData.priority,
        estimatedDuration: formData.estimatedDuration ? Number(formData.estimatedDuration) : undefined,
        notes: formData.notes,
      });

      toast.success('Ð—Ð°Ð´Ð°Ñ‡Ð°Ñ‚Ð° Ðµ Ð¾Ð±Ð½Ð¾Ð²ÐµÐ½Ð°');
      navigate(`/admin/schedules/${id}`);
    } catch {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¾Ð±Ð½Ð¾Ð²ÑÐ²Ð°Ð½Ðµ Ð½Ð° Ð·Ð°Ð´Ð°Ñ‡Ð°');
    } finally {
      setIsSaving(false);
    }
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

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate(`/admin/schedules/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors w-fit"
            aria-label="ÐÐ°Ð·Ð°Ð´ ÐºÑŠÐ¼ Ð·Ð°Ð´Ð°Ñ‡Ð°Ñ‚Ð°"
            title="ÐÐ°Ð·Ð°Ð´ ÐºÑŠÐ¼ Ð·Ð°Ð´Ð°Ñ‡Ð°Ñ‚Ð°"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">Ð ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð°Ð½Ðµ Ð½Ð° Ð·Ð°Ð´Ð°Ñ‡Ð°</h1>
            <p className="text-textSecondary mt-1">ÐžÐ±Ð½Ð¾Ð²ÐµÑ‚Ðµ Ð¸Ð½Ñ„Ð¾Ñ€Ð¼Ð°Ñ†Ð¸ÑÑ‚Ð° Ð·Ð° Ð·Ð°Ð´Ð°Ñ‡Ð°Ñ‚Ð°</p>
          </div>
        </div>

        {hasConflict && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">
              âš ï¸ ÐšÐ¾Ð½Ñ„Ð»Ð¸ÐºÑ‚: ÐœÐµÑ…Ð°Ð½Ð¸ÐºÑŠÑ‚ Ð¸Ð¼Ð° Ð´Ñ€ÑƒÐ³Ð° Ð·Ð°Ð´Ð°Ñ‡Ð° Ð² Ð¸Ð·Ð±Ñ€Ð°Ð½Ð¸Ñ Ð¿ÐµÑ€Ð¸Ð¾Ð´!
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6 max-w-4xl">
          <div className="space-y-4 sm:space-y-6">
            <Input
              label="Ð—Ð°Ð³Ð»Ð°Ð²Ð¸Ðµ *"
              type="text"
              value={formData.title}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">
                ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸Ðµ
              </label>
              <textarea
                value={formData.description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={3}
                placeholder="Ð”Ð¾Ð±Ð°Ð²ÐµÑ‚Ðµ Ð¾Ð¿Ð¸ÑÐ°Ð½Ð¸Ðµ..."
                aria-label="ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸Ðµ Ð½Ð° Ð·Ð°Ð´Ð°Ñ‡Ð°Ñ‚Ð°"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Ð”Ð°Ñ‚Ð° *"
                  type="date"
                  value={formData.date}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-textMuted mt-1">
                  Ð¡Ð¸Ð½Ñ…Ñ€Ð¾Ð½Ð¸Ð·Ð¸Ñ€Ð° ÑÐµ Ñ ÐºÑ€Ð°ÐµÐ½ ÑÑ€Ð¾Ðº Ð½Ð° Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ°Ñ‚Ð°
                </p>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-textPrimary mb-2">
                  Ð¡Ñ‚Ð°Ñ‚ÑƒÑ *
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="SCHEDULED">ÐŸÐ»Ð°Ð½Ð¸Ñ€Ð°Ð½Ð°</option>
                  <option value="IN_PROGRESS">Ð’ Ð¿Ñ€Ð¾Ñ†ÐµÑ</option>
                  <option value="READY">Ð“Ð¾Ñ‚Ð¾Ð²Ð° Ð·Ð° Ð¿Ð»Ð°Ñ‰Ð°Ð½Ðµ</option>
                  <option value="COMPLETED">ÐŸÐ»Ð°Ñ‚ÐµÐ½Ð°</option>
                  <option value="CANCELLED">ÐžÑ‚Ð¼ÐµÐ½ÐµÐ½Ð°</option>
                  <option value="DELAYED">Ð—Ð°Ð±Ð°Ð²ÐµÐ½Ð°</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="ÐÐ°Ñ‡Ð°Ð»ÐµÐ½ Ñ‡Ð°Ñ *"
                type="time"
                value={formData.startTime}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                required
              />

              <Input
                label="ÐšÑ€Ð°ÐµÐ½ Ñ‡Ð°Ñ *"
                type="time"
                value={formData.endTime}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-textPrimary mb-2">
                ÐŸÑ€Ð¸Ð¾Ñ€Ð¸Ñ‚ÐµÑ‚ *
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="LOW">ÐÐ¸ÑÑŠÐº</option>
                <option value="NORMAL">ÐÐ¾Ñ€Ð¼Ð°Ð»ÐµÐ½</option>
                <option value="HIGH">Ð’Ð¸ÑÐ¾Ðº</option>
                <option value="URGENT">Ð¡Ð¿ÐµÑˆÐµÐ½</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="worker" className="block text-sm font-medium text-textPrimary mb-2">
                  ÐœÐµÑ…Ð°Ð½Ð¸Ðº
                </label>
                <select
                  id="worker"
                  value={formData.workerId}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setFormData({ ...formData, workerId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Ð˜Ð·Ð±ÐµÑ€ÐµÑ‚Ðµ Ð¼ÐµÑ…Ð°Ð½Ð¸Ðº</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.firstName} {worker.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="order" className="block text-sm font-medium text-textPrimary mb-2">
                  Ð¡Ð²ÑŠÑ€Ð·Ð°Ð½Ð° Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ°
                </label>
                <select
                  id="order"
                  value={formData.orderId}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setFormData({ ...formData, orderId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Ð˜Ð·Ð±ÐµÑ€ÐµÑ‚Ðµ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ°</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.displayOrderNumber || order.orderNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="ÐžÑ‡Ð°ÐºÐ²Ð°Ð½Ð° Ð¿Ñ€Ð¾Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð¾ÑÑ‚ (Ð¼Ð¸Ð½ÑƒÑ‚Ð¸)"
              type="number"
              value={formData.estimatedDuration}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, estimatedDuration: e.target.value })
              }
              min="1"
              placeholder="60"
            />

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">
                Ð‘ÐµÐ»ÐµÐ¶ÐºÐ¸
              </label>
              <textarea
                value={formData.notes}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={3}
                placeholder="Ð”Ð¾Ð¿ÑŠÐ»Ð½Ð¸Ñ‚ÐµÐ»Ð½Ð¸ Ð±ÐµÐ»ÐµÐ¶ÐºÐ¸..."
                aria-label="Ð‘ÐµÐ»ÐµÐ¶ÐºÐ¸ ÐºÑŠÐ¼ Ð·Ð°Ð´Ð°Ñ‡Ð°Ñ‚Ð°"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => navigate(`/admin/schedules/${id}`)} className="w-full sm:w-auto">
              ÐžÑ‚ÐºÐ°Ð·
            </Button>
            <Button type="submit" isLoading={isSaving} disabled={hasConflict} className="w-full sm:w-auto">
              Ð—Ð°Ð¿Ð°Ð·Ð¸ Ð¿Ñ€Ð¾Ð¼ÐµÐ½Ð¸
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default ScheduleEdit;


