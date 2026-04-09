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
        toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° Ð·Ð°Ð´Ð°Ñ‡Ð°');
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
      toast.error('ÐœÐ¾Ð»Ñ Ð¿Ð¾Ð¿ÑŠÐ»Ð½ÐµÑ‚Ðµ Ð·Ð°Ð³Ð»Ð°Ð²Ð¸Ðµ Ð½Ð° Ð·Ð°Ð´Ð°Ñ‡Ð°Ñ‚Ð°');
      return;
    }


    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(formData.date);
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate < today) {
      toast.error('ÐÐµ Ð¼Ð¾Ð¶ÐµÑ‚Ðµ Ð´Ð° Ñ€ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð°Ñ‚Ðµ Ð·Ð°Ð´Ð°Ñ‡Ð¸ Ñ Ð¼Ð¸Ð½Ð°Ð»Ð¸ Ð´Ð°Ñ‚Ð¸');
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

      toast.success('Ð—Ð°Ð´Ð°Ñ‡Ð°Ñ‚Ð° Ðµ Ð¾Ð±Ð½Ð¾Ð²ÐµÐ½Ð°');
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
          <h2 className="text-xl font-bold text-textPrimary">Ð ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð°Ð½Ðµ Ð½Ð° Ð·Ð°Ð´Ð°Ñ‡Ð°</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Ð—Ð°Ñ‚Ð²Ð¾Ñ€Ð¸"
            title="Ð—Ð°Ñ‚Ð²Ð¾Ñ€Ð¸"
          >
            <X className="w-5 h-5 text-textSecondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <Input
            label="Ð—Ð°Ð³Ð»Ð°Ð²Ð¸Ðµ *"
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
              title="ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸Ðµ"
            >
              ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸Ðµ
            </label>
            <textarea
              id="schedule-description"
              value={formData.description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Ð’ÑŠÐ²ÐµÐ´Ð¸ Ð¾Ð¿Ð¸ÑÐ°Ð½Ð¸Ðµ"
              title="ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸Ðµ"
              className="w-full px-3 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
            />
          </div>

          {/* Date */}
          <Input
            label="Ð”Ð°Ñ‚Ð° *"
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
              label="ÐÐ°Ñ‡Ð°Ð»Ð¾ *"
              type="time"
              value={formData.startTime}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
              required
            />
            <Input
              label="ÐšÑ€Ð°Ð¹ *"
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
                title="ÐœÐµÑ…Ð°Ð½Ð¸Ðº"
              >
                ÐœÐµÑ…Ð°Ð½Ð¸Ðº
              </label>
              <select
                id="schedule-worker"
                value={formData.workerId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setFormData({ ...formData, workerId: e.target.value })
                }
                title="Ð˜Ð·Ð±ÐµÑ€Ð¸ Ð¼ÐµÑ…Ð°Ð½Ð¸Ðº"
                aria-label="Ð˜Ð·Ð±ÐµÑ€Ð¸ Ð¼ÐµÑ…Ð°Ð½Ð¸Ðº"
                className="w-full px-3 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Ð˜Ð·Ð±ÐµÑ€Ð¸ Ð¼ÐµÑ…Ð°Ð½Ð¸Ðº</option>
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
                title="Ð¡Ð²ÑŠÑ€Ð·Ð°Ð½Ð° Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ°"
              >
                Ð¡Ð²ÑŠÑ€Ð·Ð°Ð½Ð° Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ°
              </label>
              <select
                id="schedule-order"
                value={formData.orderId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setFormData({ ...formData, orderId: e.target.value })
                }
                title="Ð˜Ð·Ð±ÐµÑ€Ð¸ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ°"
                aria-label="Ð˜Ð·Ð±ÐµÑ€Ð¸ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ°"
                className="w-full px-3 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Ð˜Ð·Ð±ÐµÑ€Ð¸ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ°</option>
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
                title="Ð¡Ñ‚Ð°Ñ‚ÑƒÑ"
              >
                Ð¡Ñ‚Ð°Ñ‚ÑƒÑ *
              </label>
              <select
                id="schedule-status"
                value={formData.status}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                title="Ð˜Ð·Ð±ÐµÑ€Ð¸ ÑÑ‚Ð°Ñ‚ÑƒÑ"
                aria-label="Ð˜Ð·Ð±ÐµÑ€Ð¸ ÑÑ‚Ð°Ñ‚ÑƒÑ"
                className="w-full px-3 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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

            <div>
              <label
                htmlFor="schedule-priority"
                className="block text-sm font-medium text-textPrimary mb-2"
                title="ÐŸÑ€Ð¸Ð¾Ñ€Ð¸Ñ‚ÐµÑ‚"
              >
                ÐŸÑ€Ð¸Ð¾Ñ€Ð¸Ñ‚ÐµÑ‚ *
              </label>
              <select
                id="schedule-priority"
                value={formData.priority}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                title="Ð˜Ð·Ð±ÐµÑ€Ð¸ Ð¿Ñ€Ð¸Ð¾Ñ€Ð¸Ñ‚ÐµÑ‚"
                aria-label="Ð˜Ð·Ð±ÐµÑ€Ð¸ Ð¿Ñ€Ð¸Ð¾Ñ€Ð¸Ñ‚ÐµÑ‚"
                className="w-full px-3 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="LOW">ÐÐ¸ÑÑŠÐº</option>
                <option value="NORMAL">ÐÐ¾Ñ€Ð¼Ð°Ð»ÐµÐ½</option>
                <option value="HIGH">Ð’Ð¸ÑÐ¾Ðº</option>
                <option value="URGENT">Ð¡Ð¿ÐµÑˆÐµÐ½</option>
              </select>
            </div>
          </div>

          {/* Estimated Duration */}
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

          {/* Notes */}
          <div>
            <label
              htmlFor="schedule-notes"
              className="block text-sm font-medium text-textPrimary mb-2"
              title="Ð‘ÐµÐ»ÐµÐ¶ÐºÐ¸"
            >
              Ð‘ÐµÐ»ÐµÐ¶ÐºÐ¸
            </label>
            <textarea
              id="schedule-notes"
              value={formData.notes}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Ð’ÑŠÐ²ÐµÐ´Ð¸ Ð±ÐµÐ»ÐµÐ¶ÐºÐ¸"
              title="Ð‘ÐµÐ»ÐµÐ¶ÐºÐ¸"
              className="w-full px-3 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button type="button" onClick={onClose} fullWidth variant="secondary">
              ÐžÑ‚ÐºÐ°Ð·
            </Button>
            <Button type="submit" fullWidth isLoading={isSaving}>
              Ð—Ð°Ð¿Ð°Ð·Ð¸
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;

