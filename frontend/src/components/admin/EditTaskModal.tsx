import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';
import axios from 'axios';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import toast from 'react-hot-toast';

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
}

interface Order {
  id: string;
  orderNumber: string;
  displayOrderNumber?: string | null;
}

interface EditTaskModalProps {
  scheduleId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
};

const EditTaskModal = ({ scheduleId, onClose, onSuccess }: EditTaskModalProps) => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [formData, setFormData] = useState({
    workerId: '',
    orderId: '',
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    status: 'SCHEDULED',
    priority: 'NORMAL',
    estimatedDuration: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scheduleRes, workersRes, ordersRes] = await Promise.all([
          api.get(`/schedules/${scheduleId}`),
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

        setWorkers(workersRes.data.workers || []);
        setOrders(ordersRes.data.orders || []);
      } catch {
        toast.error('Грешка при зареждане на задача');
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [scheduleId, onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error('Моля попълнете заглавие на задачата');
      return;
    }


    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(formData.date);
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate < today) {
      toast.error('Не можете да редактирате задачи с минали дати');
      return;
    }

    setIsSaving(true);

    try {
      const startTime = new Date(`${formData.date}T${formData.startTime}`).toISOString();
      const endTime = new Date(`${formData.date}T${formData.endTime}`).toISOString();

      await api.put(`/schedules/${scheduleId}`, {
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

      toast.success('Задачата е обновена');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Greshka pri obnovyavane na zadacha');
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-cardBg rounded-2xl shadow-card max-w-2xl w-full p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-cardBg rounded-2xl shadow-card max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-textPrimary">Редактиране на задача</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Затвори"
            title="Затвори"
          >
            <X className="w-5 h-5 text-textSecondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <Input
            label="Заглавие *"
            value={formData.title}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
          />

          {/* Description */}
          <div>
            <label
              htmlFor="schedule-description"
              className="block text-sm font-medium text-textPrimary mb-2"
              title="Описание"
            >
              Описание
            </label>
            <textarea
              id="schedule-description"
              value={formData.description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Въведи описание"
              title="Описание"
              className="w-full px-3 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
            />
          </div>

          {/* Date */}
          <Input
            label="Дата *"
            type="date"
            value={formData.date}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setFormData({ ...formData, date: e.target.value })
            }
            required
          />

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Начало *"
              type="time"
              value={formData.startTime}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
              required
            />
            <Input
              label="Край *"
              type="time"
              value={formData.endTime}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, endTime: e.target.value })
              }
              required
            />
          </div>

          {/* Worker and Order */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="schedule-worker"
                className="block text-sm font-medium text-textPrimary mb-2"
                title="Механик"
              >
                Механик
              </label>
              <select
                id="schedule-worker"
                value={formData.workerId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setFormData({ ...formData, workerId: e.target.value })
                }
                title="Избери механик"
                aria-label="Избери механик"
                className="w-full px-3 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Избери механик</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.firstName} {worker.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="schedule-order"
                className="block text-sm font-medium text-textPrimary mb-2"
                title="Свързана поръчка"
              >
                Свързана поръчка
              </label>
              <select
                id="schedule-order"
                value={formData.orderId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setFormData({ ...formData, orderId: e.target.value })
                }
                title="Избери поръчка"
                aria-label="Избери поръчка"
                className="w-full px-3 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Избери поръчка</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.displayOrderNumber || order.orderNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="schedule-status"
                className="block text-sm font-medium text-textPrimary mb-2"
                title="Статус"
              >
                Статус *
              </label>
              <select
                id="schedule-status"
                value={formData.status}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                title="Избери статус"
                aria-label="Избери статус"
                className="w-full px-3 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="SCHEDULED">Планирана</option>
                <option value="IN_PROGRESS">В процес</option>
                <option value="READY">Готова за плащане</option>
                <option value="COMPLETED">Платена</option>
                <option value="CANCELLED">Отменена</option>
                <option value="DELAYED">Забавена</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="schedule-priority"
                className="block text-sm font-medium text-textPrimary mb-2"
                title="Приоритет"
              >
                Приоритет *
              </label>
              <select
                id="schedule-priority"
                value={formData.priority}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                title="Избери приоритет"
                aria-label="Избери приоритет"
                className="w-full px-3 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="LOW">Нисък</option>
                <option value="NORMAL">Нормален</option>
                <option value="HIGH">Висок</option>
                <option value="URGENT">Спешен</option>
              </select>
            </div>
          </div>

          {/* Estimated Duration */}
          <Input
            label="Очаквана продължителност (минути)"
            type="number"
            value={formData.estimatedDuration}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setFormData({ ...formData, estimatedDuration: e.target.value })
            }
            min="1"
            placeholder="60"
          />

          {/* Notes */}
          <div>
            <label
              htmlFor="schedule-notes"
              className="block text-sm font-medium text-textPrimary mb-2"
              title="Бележки"
            >
              Бележки
            </label>
            <textarea
              id="schedule-notes"
              value={formData.notes}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Въведи бележки"
              title="Бележки"
              className="w-full px-3 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button type="button" onClick={onClose} fullWidth variant="secondary">
              Отказ
            </Button>
            <Button type="submit" fullWidth isLoading={isSaving}>
              Запази
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;

