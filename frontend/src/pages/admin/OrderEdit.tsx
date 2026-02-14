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
  const [hasInvoice, setHasInvoice] = useState(false);
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
        const invoiceExists = Array.isArray(order.invoices) && order.invoices.length > 0;
        setFormData({
          status: !invoiceExists && order.status === 'COMPLETED' ? 'READY' : order.status,
          workerId: order.worker?.id || '',
          diagnosis: order.diagnosis || '',
          notes: order.notes || '',
          startDate: order.startDate ? order.startDate.split('T')[0] : '',
          endDate: order.endDate ? order.endDate.split('T')[0] : '',
          paymentMethod: order.paymentMethod || '',
        });
        setHasInvoice(invoiceExists);
        setOrderItems(order.orderItems || []);
        const allWorkers = workersRes.data.workers || [];
        const activeWorkers = allWorkers.filter(
          (worker: Worker) =>
            worker.isActive && (worker.membershipStatus ? worker.membershipStatus === 'ACTIVE' : true)
        );
        setWorkers(activeWorkers);
      } catch {
        toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ°');
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
        toast.error('ÐšÑ€Ð°Ð¹Ð½Ð¸ÑÑ‚ ÑÑ€Ð¾Ðº Ð½Ðµ Ð¼Ð¾Ð¶Ðµ Ð´Ð° Ðµ Ð¿Ñ€ÐµÐ´Ð¸ Ð½Ð°Ñ‡Ð°Ð»Ð½Ð°Ñ‚Ð° Ð´Ð°Ñ‚Ð°.');
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
      toast.error('ÐŸÐ¾Ð¿ÑŠÐ»Ð½ÐµÑ‚Ðµ ÐºÐ¾Ð»Ð¸Ñ‡ÐµÑÑ‚Ð²Ð¾ Ð¸ Ñ†ÐµÐ½Ð° Ð·Ð° Ð²ÑÐ¸Ñ‡ÐºÐ¸ Ð´Ð¾Ð±Ð°Ð²ÐµÐ½Ð¸ ÑƒÑÐ»ÑƒÐ³Ð¸/Ñ‡Ð°ÑÑ‚Ð¸/ÐºÐ¾Ð½ÑÑƒÐ¼Ð°Ñ‚Ð¸Ð²Ð¸.');
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
      toast.success('ÐŸÐ¾Ñ€ÑŠÑ‡ÐºÐ°Ñ‚Ð° Ðµ Ð¾Ð±Ð½Ð¾Ð²ÐµÐ½Ð°');
      navigate(`/admin/orders/${id}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Грешка при обновяване");
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
            title="ÐÐ°Ð·Ð°Ð´ ÐºÑŠÐ¼ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ°Ñ‚Ð°"
            aria-label="ÐÐ°Ð·Ð°Ð´ ÐºÑŠÐ¼ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ°Ñ‚Ð°"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">
              Ð ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð°Ð½Ðµ Ð½Ð° Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ°
            </h1>
            <p className="text-textSecondary mt-1">
              ÐžÐ±Ð½Ð¾Ð²ÐµÑ‚Ðµ Ð¸Ð½Ñ„Ð¾Ñ€Ð¼Ð°Ñ†Ð¸ÑÑ‚Ð° Ð¸ Ð´ÐµÑ‚Ð°Ð¹Ð»Ð¸Ñ‚Ðµ
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6 max-w-4xl">
            <h2 className="text-lg font-semibold text-textPrimary mb-4">
              ÐžÑÐ½Ð¾Ð²Ð½Ð° Ð¸Ð½Ñ„Ð¾Ñ€Ð¼Ð°Ñ†Ð¸Ñ
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  aria-label="Ð¡Ñ‚Ð°Ñ‚ÑƒÑ Ð½Ð° Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ°Ñ‚Ð°"
                >
                  <option value="WAITING">Ð˜Ð·Ñ‡Ð°ÐºÐ²Ð°Ð½Ðµ</option>
                  <option value="IN_PROGRESS">Ð’ Ð¿Ñ€Ð¾Ñ†ÐµÑ</option>
                  <option value="READY">Ð“Ð¾Ñ‚Ð¾Ð²Ð° Ð·Ð° Ð¿Ð»Ð°Ñ‰Ð°Ð½Ðµ</option>
                  {hasInvoice && <option value="COMPLETED">ÐŸÐ»Ð°Ñ‚ÐµÐ½Ð°</option>}
                  <option value="CANCELLED">ÐžÑ‚ÐºÐ°Ð·Ð°Ð½Ð°</option>
                </select>
              </div>

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
                  aria-label="Ð˜Ð·Ð±Ð¾Ñ€ Ð½Ð° Ð¼ÐµÑ…Ð°Ð½Ð¸Ðº"
                >
                  <option value="">ÐÐµ Ðµ Ð½Ð°Ð·Ð½Ð°Ñ‡ÐµÐ½</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.firstName} {worker.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="ÐÐ°Ñ‡Ð°Ð»Ð½Ð° Ð´Ð°Ñ‚Ð°"
                type="date"
                value={formData.startDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />

              <Input
                label="ÐšÑ€Ð°ÐµÐ½ ÑÑ€Ð¾Ðº"
                type="date"
                value={formData.endDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </div>

            <div className="mt-4">
              <label htmlFor="diagnosis" className="block text-sm font-medium text-textPrimary mb-2">
                Ð”Ð¸Ð°Ð³Ð½Ð¾Ð·Ð°
              </label>
              <textarea
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, diagnosis: e.target.value })
                }
                className="w-full px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={3}
                placeholder="Ð’ÑŠÐ²ÐµÐ´ÐµÑ‚Ðµ Ð´Ð¸Ð°Ð³Ð½Ð¾Ð·Ð°..."
                aria-label="Ð”Ð¸Ð°Ð³Ð½Ð¾Ð·Ð° Ð½Ð° Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ°Ñ‚Ð°"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="notes" className="block text-sm font-medium text-textPrimary mb-2">
                Ð‘ÐµÐ»ÐµÐ¶ÐºÐ¸
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={3}
                placeholder="Ð’ÑŠÐ²ÐµÐ´ÐµÑ‚Ðµ Ð±ÐµÐ»ÐµÐ¶ÐºÐ¸..."
                aria-label="Ð‘ÐµÐ»ÐµÐ¶ÐºÐ¸ ÐºÑŠÐ¼ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ°Ñ‚Ð°"
              />
            </div>
          </div>

          <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6 max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-textPrimary">
                Ð”ÐµÑ‚Ð°Ð¹Ð»Ð¸ Ð½Ð° Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ°Ñ‚Ð°
              </h2>
              <Button type="button" onClick={handleAddItem} className="w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                Ð”Ð¾Ð±Ð°Ð²Ð¸ Ñ€ÐµÐ´
              </Button>
            </div>

            <div className="space-y-3">
              {orderItems.map((item, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                  <div className="col-span-12 sm:col-span-2">
                    <label className="sr-only">
                      Ð¢Ð¸Ð¿ Ð½Ð° Ñ€ÐµÐ´ {index + 1}
                    </label>
                    <select
                      value={item.type}
                      onChange={(e) =>
                        handleItemChange(index, 'type', e.target.value)
                      }
                      className="w-full px-2 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label={`Ð¢Ð¸Ð¿ Ð½Ð° Ñ€ÐµÐ´ ${index + 1}`}
                    >
                       <option value="LABOR">Ð£ÑÐ»ÑƒÐ³Ð°</option> 
                      <option value="PART">Ð§Ð°ÑÑ‚</option>
                       <option value="CONSUMABLE">ÐšÐ¾Ð½ÑÑƒÐ¼Ð°Ñ‚Ð¸Ð²</option>
                    </select>
                  </div>

                  <div className="col-span-12 sm:col-span-4">
                    <label className="sr-only">
                      ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸Ðµ Ð½Ð° Ñ€ÐµÐ´ {index + 1}
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
                      placeholder="ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸Ðµ"
                      className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label={`ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸Ðµ Ð½Ð° Ñ€ÐµÐ´ ${index + 1}`}
                    />
                  </div>

                  <div className="col-span-12 sm:col-span-2">
                    <label className="sr-only">
                      ÐšÐ¾Ð»Ð¸Ñ‡ÐµÑÑ‚Ð²Ð¾ Ð½Ð° Ñ€ÐµÐ´ {index + 1}
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
                      placeholder="ÐšÐ¾Ð»."
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label={`ÐšÐ¾Ð»Ð¸Ñ‡ÐµÑÑ‚Ð²Ð¾ Ð½Ð° Ñ€ÐµÐ´ ${index + 1}`}
                    />
                  </div>

                  <div className="col-span-12 sm:col-span-3">
                    <label className="sr-only">
                      Ð•Ð´Ð¸Ð½Ð¸Ñ‡Ð½Ð° Ñ†ÐµÐ½Ð° Ð½Ð° Ñ€ÐµÐ´ {index + 1}
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
                      placeholder="Ð¦ÐµÐ½Ð°"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label={`Ð•Ð´Ð¸Ð½Ð¸Ñ‡Ð½Ð° Ñ†ÐµÐ½Ð° Ð½Ð° Ñ€ÐµÐ´ ${index + 1}`}
                    />
                  </div>

                  <div className="col-span-12 sm:col-span-1">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Ð˜Ð·Ñ‚Ñ€Ð¸Ð¹ Ñ€ÐµÐ´"
                      aria-label={`Ð˜Ð·Ñ‚Ñ€Ð¸Ð¹ Ñ€ÐµÐ´ ${index + 1}`}
                    >
                      <Trash2 className="w-4 h-4 text-error" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {orderItems.length === 0 && (
              <p className="text-center text-textSecondary py-4">
                ÐÑÐ¼Ð° Ð´Ð¾Ð±Ð°Ð²ÐµÐ½Ð¸ Ñ€ÐµÐ´Ð¾Ð²Ðµ
              </p>
            )}
          </div>

          <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6 max-w-4xl">
            <h2 className="text-lg font-semibold text-textPrimary mb-4">
              ÐŸÐ»Ð°Ñ‰Ð°Ð½Ðµ
            </h2>
            <div className="max-w-md">
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-textPrimary mb-2">
                ÐœÐµÑ‚Ð¾Ð´ Ð½Ð° Ð¿Ð»Ð°Ñ‰Ð°Ð½Ðµ
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
                aria-label="ÐœÐµÑ‚Ð¾Ð´ Ð½Ð° Ð¿Ð»Ð°Ñ‰Ð°Ð½Ðµ"
              >
                <option value="">Ð˜Ð·Ð±ÐµÑ€Ð¸ Ð¼ÐµÑ‚Ð¾Ð´</option>
                <option value="CASH">ÐšÐµÑˆ</option>
                <option value="CARD">ÐšÐ°Ñ€Ñ‚Ð°</option>
                <option value="BANK_TRANSFER">Ð‘Ð°Ð½ÐºÐ¾Ð² Ð¿Ñ€ÐµÐ²Ð¾Ð´</option>
              </select>
              <p className="text-xs text-textMuted mt-1">
                ÐÐ²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡Ð½Ð¾ ÑÐµ Ð¼Ð°Ñ€ÐºÐ¸Ñ€Ð° ÐºÐ°Ñ‚Ð¾ Ð¿Ð»Ð°Ñ‚ÐµÐ½Ð° Ð¿Ñ€Ð¸ ÑÑ‚Ð°Ñ‚ÑƒÑ "ÐŸÐ»Ð°Ñ‚ÐµÐ½Ð°"
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
              ÐžÑ‚ÐºÐ°Ð·
            </Button>
            <Button type="submit" isLoading={isSaving} className="w-full sm:w-auto">
              Ð—Ð°Ð¿Ð°Ð·Ð¸ Ð¿Ñ€Ð¾Ð¼ÐµÐ½Ð¸
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default OrderEdit;





