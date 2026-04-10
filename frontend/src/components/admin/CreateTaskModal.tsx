import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import api from '../../services/api';
import axios from 'axios';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import toast from 'react-hot-toast';

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  isAvailable?: boolean;
}

interface CreateTaskModalProps {
  selectedDate: Date;
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

const CreateTaskModal = ({
  selectedDate,
  onClose,
  onSuccess,
}: CreateTaskModalProps) => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [formData, setFormData] = useState({
    workerId: '',
    title: '',
    description: '',
    startTime: format(selectedDate, "yyyy-MM-dd'T'09:00"),
    endTime: format(selectedDate, "yyyy-MM-dd'T'17:00"),
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {

        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const startTimeStr = formData.startTime.split('T')[1]; // "09:00"
        const endTimeStr = formData.endTime.split('T')[1]; // "17:00"


        const response = await api.get('/workers/availability', {
          params: {
            date: dateStr,
            startTime: startTimeStr,
            endTime: endTimeStr,
          },
        });

        setWorkers(response.data.workers || []);
      } catch {
        toast.error('Грешка при зареждане на механици');
      }
    };

    fetchWorkers();
  }, [selectedDate, formData.startTime, formData.endTime]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error('Моля попълнете заглавие на задачата');
      return;
    }


    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    if (selected < today) {
      toast.error('Не можете да създавате задачи за минали дни');
      return;
    }

    setIsLoading(true);

    try {

      const scheduleData = {
        title: formData.title,
        description: formData.description,
        workerId: formData.workerId || undefined,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      };

      await api.post('/schedules', scheduleData);
      toast.success('Задачата е създадена');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Greshka pri suzdavane na zadacha');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-cardBg rounded-2xl shadow-card max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-textPrimary">
            Нова задача
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Затвори"
            title="Затвори"
          >
            <X className="w-5 h-5 text-textSecondary" />
          </button>
        </div>

        {/* Date */}
        <div className="mb-4 p-3 bg-mainBg rounded-lg">
          <p className="text-sm text-textSecondary">Дата</p>
          <p className="font-medium text-textPrimary">
            {format(selectedDate, 'dd MMMM yyyy', { locale: bg })}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Worker */}
          <div>
            <label
              htmlFor="worker-select"
              className="block text-sm font-medium text-textPrimary mb-2"
            >
              Механик *
            </label>
            <select
              id="worker-select"
              value={formData.workerId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setFormData({ ...formData, workerId: e.target.value })
              }
              className="w-full px-3 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Избери механик</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.firstName} {worker.lastName}
                  {worker.isAvailable ? ' • Свободен' : ' • Зает'}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <Input
            label="Задача *"
            value={formData.title}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
          />

          {/* Description */}
          <div>
            <label
              htmlFor="task-description"
              className="block text-sm font-medium text-textPrimary mb-2"
            >
              Описание
            </label>
            <textarea
              id="task-description"
              value={formData.description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Начало"
              type="time"
              value={formData.startTime.split('T')[1]}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({
                  ...formData,
                  startTime: `${format(
                    selectedDate,
                    'yyyy-MM-dd'
                  )}T${e.target.value}`,
                })
              }
            />
            <Input
              label="Край"
              type="time"
              value={formData.endTime.split('T')[1]}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({
                  ...formData,
                  endTime: `${format(
                    selectedDate,
                    'yyyy-MM-dd'
                  )}T${e.target.value}`,
                })
              }
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              onClick={onClose}
              fullWidth
              variant="secondary"
            >
              Отказ
            </Button>
            <Button type="submit" fullWidth isLoading={isLoading}>
              Създай
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;




