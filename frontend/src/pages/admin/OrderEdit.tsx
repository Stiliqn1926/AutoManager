import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
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

interface OrderItem {
  id?: string;
  type: string;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
}

interface OrderFormData {
  status: string;
  workerId: string;
  diagnosis: string;
  notes: string;
  startDate: string;
  endDate: string;
  paymentMethod: string;
}

const OrderEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<OrderFormData>({
    status: 'WAITING',
    workerId: '',
    diagnosis: '',
    notes: '',
    startDate: '',
    endDate: '',
    paymentMethod: '',
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orderRes, workersRes] = await Promise.all([
          api.get(`/orders/${id}`),
          api.get('/workers'),
        ]);

        const order = orderRes.data.order;
        setFormData({
          status: order.status,
          workerId: order.worker?.id || '',
          diagnosis: order.diagnosis || '',
          notes: order.notes || '',
          startDate: order.startDate ? order.startDate.split('T')[0] : '',
          endDate: order.endDate ? order.endDate.split('T')[0] : '',
          paymentMethod: order.paymentMethod || '',
        });
        setOrderItems(order.orderItems || []);
        const allWorkers = workersRes.data.workers || [];
        const activeWorkers = allWorkers.filter(
          (worker: Worker) =>
            worker.isActive && (worker.membershipStatus ? worker.membershipStatus === 'ACTIVE' : true)
        );
        setWorkers(activeWorkers);
      } catch {
        toast.error('Грешка при зареждане на поръчка');
        navigate('/admin/orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleAddItem = () => {
    setOrderItems([
      ...orderItems,
      { type: 'LABOR', description: '', quantity: '', unitPrice: '' },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    setOrderItems(updated);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        toast.error('Крайният срок не може да е преди началната дата.');
        return;
      }
    }
    const hasInvalidItem = orderItems.some((item) => {
      const hasDescription = item.description.trim() !== '';
      if (!hasDescription) return false;
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      return !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice <= 0;
    });

    if (hasInvalidItem) {
      toast.error('Попълнете количество и цена за всички добавени услуги/части/консумативи.');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        status: formData.status,
        diagnosis: formData.diagnosis,
        notes: formData.notes,
        ...(formData.workerId && { workerId: formData.workerId }),
        ...(formData.startDate && { startDate: formData.startDate }),
        ...(formData.endDate && { endDate: formData.endDate }),
        ...(formData.paymentMethod && {
          paymentMethod: formData.paymentMethod,
        }),
        orderItems: orderItems.map((item) => ({
          ...(item.id && { id: item.id }),
          type: item.type,
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      };

      await api.put(`/orders/${id}`, payload);
      toast.success('Поръчката е обновена');
      navigate(`/admin/orders/${id}`);
    } catch {
      toast.error('Грешка при обновяване');
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <button
            onClick={() => navigate(`/admin/orders/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors w-fit"
            title="Назад към поръчката"
            aria-label="Назад към поръчката"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">
              Редактиране на поръчка
            </h1>
            <p className="text-textSecondary mt-1">
              Обновете информацията и детайлите
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6 max-w-4xl">
            <h2 className="text-lg font-semibold text-textPrimary mb-4">
              Основна информация
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-textPrimary mb-2">
                  Статус *
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  aria-label="Статус на поръчката"
                >
                  <option value="WAITING">Изчакване</option>
                  <option value="IN_PROGRESS">В процес</option>
                  <option value="READY">Готова за плащане</option>
                  <option value="COMPLETED">Платена</option>
                  <option value="CANCELLED">Отказана</option>
                </select>
              </div>

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
                  className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Избор на механик"
                >
                  <option value="">Не е назначен</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.firstName} {worker.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Начална дата"
                type="date"
                value={formData.startDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />

              <Input
                label="Краен срок"
                type="date"
                value={formData.endDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </div>

            <div className="mt-4">
              <label htmlFor="diagnosis" className="block text-sm font-medium text-textPrimary mb-2">
                Диагноза
              </label>
              <textarea
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, diagnosis: e.target.value })
                }
                className="w-full px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={3}
                placeholder="Въведете диагноза..."
                aria-label="Диагноза на поръчката"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="notes" className="block text-sm font-medium text-textPrimary mb-2">
                Бележки
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={3}
                placeholder="Въведете бележки..."
                aria-label="Бележки към поръчката"
              />
            </div>
          </div>

          <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6 max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-textPrimary">
                Детайли на поръчката
              </h2>
              <Button type="button" onClick={handleAddItem} className="w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                Добави ред
              </Button>
            </div>

            <div className="space-y-3">
              {orderItems.map((item, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                  <div className="col-span-12 sm:col-span-2">
                    <label className="sr-only">
                      Тип на ред {index + 1}
                    </label>
                    <select
                      value={item.type}
                      onChange={(e) =>
                        handleItemChange(index, 'type', e.target.value)
                      }
                      className="w-full px-2 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label={`Тип на ред ${index + 1}`}
                    >
                       <option value="LABOR">Услуга</option> 
                      <option value="PART">Част</option>
                       <option value="CONSUMABLE">Консуматив</option>
                    </select>
                  </div>

                  <div className="col-span-12 sm:col-span-4">
                    <label className="sr-only">
                      Описание на ред {index + 1}
                    </label>
                    <input
                      type="text"
                      value={item.description || ''}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          'description',
                          e.target.value
                        )
                      }
                      placeholder="Описание"
                      className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label={`Описание на ред ${index + 1}`}
                    />
                  </div>

                  <div className="col-span-12 sm:col-span-2">
                    <label className="sr-only">
                      Количество на ред {index + 1}
                    </label>
                    <input
                      type="number"
                      value={item.quantity || ''}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          'quantity',
                          e.target.value ? parseFloat(e.target.value) : ''
                        )
                      }
                      placeholder="Кол."
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label={`Количество на ред ${index + 1}`}
                    />
                  </div>

                  <div className="col-span-12 sm:col-span-3">
                    <label className="sr-only">
                      Единична цена на ред {index + 1}
                    </label>
                    <input
                      type="number"
                      value={item.unitPrice || ''}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          'unitPrice',
                          e.target.value ? parseFloat(e.target.value) : ''
                        )
                      }
                      placeholder="Цена"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label={`Единична цена на ред ${index + 1}`}
                    />
                  </div>

                  <div className="col-span-12 sm:col-span-1">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Изтрий ред"
                      aria-label={`Изтрий ред ${index + 1}`}
                    >
                      <Trash2 className="w-4 h-4 text-error" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {orderItems.length === 0 && (
              <p className="text-center text-textSecondary py-4">
                Няма добавени редове
              </p>
            )}
          </div>

          <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6 max-w-4xl">
            <h2 className="text-lg font-semibold text-textPrimary mb-4">
              Плащане
            </h2>
            <div className="max-w-md">
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-textPrimary mb-2">
                Метод на плащане
              </label>
              <select
                id="paymentMethod"
                value={formData.paymentMethod}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setFormData({
                    ...formData,
                    paymentMethod: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Метод на плащане"
              >
                <option value="">Избери метод</option>
                <option value="CASH">Кеш</option>
                <option value="CARD">Карта</option>
                <option value="BANK_TRANSFER">Банков превод</option>
              </select>
              <p className="text-xs text-textMuted mt-1">
                Автоматично се маркира като платена при статус "Платена"
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 max-w-4xl">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/admin/orders/${id}`)}
              className="w-full sm:w-auto"
            >
              Отказ
            </Button>
            <Button type="submit" isLoading={isSaving} className="w-full sm:w-auto">
              Запази промени
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default OrderEdit;



