import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
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
}

interface Order {
  id: string;
  orderNumber: string;
}

interface ScheduleFormData {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  workerId: string;
  orderId: string;
  priority: string;
  estimatedDuration: string;
  notes: string;
}

const ScheduleCreate = () => {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const [formData, setFormData] = useState<ScheduleFormData>({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    workerId: '',
    orderId: '',
    priority: 'NORMAL',
    estimatedDuration: '',
    notes: '',
  });

  useEffect(() => {
    const fetchWorkersAndOrders = async () => {
      try {
        const [workersRes, ordersRes] = await Promise.all([
          api.get('/workers'),
          api.get('/orders'),
        ]);
        setWorkers(workersRes.data.workers || []);
        setOrders(ordersRes.data.orders || []);
      } catch {
        toast.error('Грешка при зареждане на данни');
      }
    };

    fetchWorkersAndOrders();
  }, []);

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
        });

        setHasConflict(response.data.hasConflict);
        if (response.data.hasConflict) {
          toast.error('Конфликт: механикът има друга задача в този период!');
        }
      } catch {
        // Игнорираме грешката
      }
    };

    const timeoutId = setTimeout(() => {
      checkForConflicts();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.workerId, formData.date, formData.startTime, formData.endTime]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (hasConflict) {
      toast.error('Не може да създадете задача с конфликтно време!');
      return;
    }

    setIsSaving(true);

    try {
      const startTime = new Date(`${formData.date}T${formData.startTime}`).toISOString();
      const endTime = new Date(`${formData.date}T${formData.endTime}`).toISOString();

      await api.post('/schedules', {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        startTime,
        endTime,
        workerId: formData.workerId || undefined,
        orderId: formData.orderId || undefined,
        priority: formData.priority,
        estimatedDuration: formData.estimatedDuration ? Number(formData.estimatedDuration) : undefined,
        notes: formData.notes,
      });

      toast.success('Задачата е създадена');
      navigate('/admin/schedules');
    } catch {
      toast.error('Грешка при създаване на задача');
    } finally {
      setIsSaving(false);
    }
  };

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
          <div>
            <h1 className="text-3xl font-bold text-textPrimary">Нова задача в графика</h1>
            <p className="text-textSecondary mt-1">Създайте нова задача за механик</p>
          </div>
        </div>

        {hasConflict && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">
              ⚠️ Конфликт: Механикът има друга задача в избрания период!
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-cardBg rounded-2xl shadow-card p-6 max-w-4xl">
          <div className="space-y-6">
            <Input
              label="Заглавие *"
              type="text"
              value={formData.title}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={3}
                placeholder="Добавете описание..."
                aria-label="Описание на задачата"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Дата *"
                type="date"
                value={formData.date}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-textPrimary mb-2">
                  Приоритет *
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
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

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Начален час *"
                type="time"
                value={formData.startTime}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                required
              />

              <Input
                label="Краен час *"
                type="time"
                value={formData.endTime}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="worker" className="block text-sm font-medium text-textPrimary mb-2">
                  Механик
                </label>
                <select
                  id="worker"
                  value={formData.workerId}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setFormData({ ...formData, workerId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Изберете механик</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.firstName} {worker.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="order" className="block text-sm font-medium text-textPrimary mb-2">
                  Свързана поръчка
                </label>
                <select
                  id="order"
                  value={formData.orderId}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setFormData({ ...formData, orderId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Изберете поръчка</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.orderNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">
                Бележки
              </label>
              <textarea
                value={formData.notes}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full px-4 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={3}
                placeholder="Допълнителни бележки..."
                aria-label="Бележки към задачата"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/schedules')}>
              Отказ
            </Button>
            <Button type="submit" isLoading={isSaving} disabled={hasConflict}>
              Създай задача
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default ScheduleCreate;