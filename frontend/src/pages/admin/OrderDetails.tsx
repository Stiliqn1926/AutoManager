import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Car,
  Wrench,
  Calendar,
  FileText,
  CreditCard,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';
import FinalizeOrderModal from './FinalizeOrderModal';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface OrderItem {
  id: string;
  type: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalPrice: number;
  isPaid: boolean;
  paymentMethod: string | null;
  paidAt: string | null;
  clientDescription: string;
  diagnosis: string | null;
  notes: string | null;
  startDate: string | null;
  endDate: string | null;
  completedAt: string | null;
  invoiceUrl: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string; // Fallback за pending клиенти
    user?: {
      email: string;
    } | null;
  };
  vehicle: {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
    year: number | null;
  };
  worker: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  orderItems: OrderItem[];
}

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/orders/${id}`);
        setOrder(response.data.order);
      } catch {
        toast.error('Грешка при зареждане на поръчка');
        navigate('/admin/orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!order) return;
    if (!confirm(`Сигурни ли сте, че искате да изтриете поръчка ${order.orderNumber}?`)) return;

    try {
      await api.delete(`/orders/${id}`);
      toast.success('Поръчката е изтрита');
      navigate('/admin/orders');
    } catch {
      toast.error('Грешка при изтриване');
    }
  };

  const handleFinalize = async () => {
    try {
      await api.post(`/orders/${id}/finalize`);
      toast.success('Фактурата е генерирана и изпратена');
      // Refresh order data
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data.order);
    } catch {
      toast.error('Грешка при финализиране');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      WAITING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      READY: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    const labels = {
      WAITING: 'Изчакване',
      IN_PROGRESS: 'В процес',
      READY: 'Готова',
      COMPLETED: 'Завършена',
      CANCELLED: 'Отказана',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getItemTypeBadge = (type: string | null | undefined) => {
    const styles: Record<string, string> = {
      LABOR: 'bg-slate-100 text-slate-700',
      PART: 'bg-slate-100 text-slate-700',
      CONSUMABLE: 'bg-slate-100 text-slate-700',
      OTHER: 'bg-slate-100 text-slate-700',
    };
    const labels: Record<string, string> = {
      LABOR: 'Услуга',
      PART: 'Част',
      CONSUMABLE: 'Консуматив',
      OTHER: 'Друго',
    };
    const displayType = type || 'OTHER';
    const label = labels[displayType] || displayType || 'Неизвестно';
    const style = styles[displayType] || 'bg-slate-100 text-slate-700';
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${style}`}>
        {label}
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

  if (!order) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-textSecondary">Поръчката не е намерена</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/orders')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Назад към поръчки"
            title="Назад към поръчки"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-textPrimary">
              Поръчка {order.orderNumber}
            </h1>
            <p className="text-textSecondary mt-1">{getStatusBadge(order.status)}</p>
          </div>

          <div className="flex gap-3">
            {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
              <>
                {(order.status === 'IN_PROGRESS' || order.status === 'READY') && !order.invoiceUrl && (
                  <Button onClick={() => setShowFinalizeModal(true)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Финализирай и изпрати фактура
                  </Button>
                )}
                <Button onClick={() => navigate(`/admin/orders/${id}/edit`)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Редактирай
                </Button>
              </>
            )}
            {order.invoiceUrl && (
              <Button
                onClick={() => window.open(order.invoiceUrl!, '_blank')}
                variant="secondary"
              >
                <FileText className="w-4 h-4 mr-2" />
                Свали фактура
              </Button>
            )}
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Изтрий
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Клиент */}
            <div className="bg-cardBg rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-semibold text-textPrimary mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Клиент
              </h2>
              <div
                onClick={() => navigate(`/admin/clients/${order.client.id}`)}
                className="p-4 bg-mainBg rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <p className="font-medium text-textPrimary">
                  {order.client.firstName} {order.client.lastName}
                </p>
                <p className="text-sm text-textSecondary mt-1">{order.client.phone}</p>
                <p className="text-sm text-textSecondary">{order.client.user?.email || order.client.email || '-'}</p>
              </div>
            </div>

            {/* Автомобил */}
            <div className="bg-cardBg rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-semibold text-textPrimary mb-4 flex items-center gap-2">
                <Car className="w-5 h-5" />
                Автомобил
              </h2>
              <div
                onClick={() => navigate(`/admin/vehicles/${order.vehicle.id}`)}
                className="p-4 bg-mainBg rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <p className="font-medium text-textPrimary">
                  {order.vehicle.brand} {order.vehicle.model}{' '}
                  {order.vehicle.year && `(${order.vehicle.year})`}
                </p>
                <p className="text-sm text-textSecondary mt-1">
                  {order.vehicle.licensePlate}
                </p>
              </div>
            </div>

            {/* Механик */}
            {order.worker && (
              <div className="bg-cardBg rounded-2xl shadow-card p-6">
                <h2 className="text-lg font-semibold text-textPrimary mb-4 flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Механик
                </h2>
                <div
                  onClick={() => navigate(`/admin/workers/${order.worker!.id}`)}
                  className="p-4 bg-mainBg rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <p className="font-medium text-textPrimary">
                    {order.worker.firstName} {order.worker.lastName}
                  </p>
                </div>
              </div>
            )}

            {/* Описание и диагноза */}
            <div className="bg-cardBg rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-semibold text-textPrimary mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Описание и диагноза
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-textSecondary mb-2">
                    Описание от клиента:
                  </p>
                  <p className="text-textPrimary bg-mainBg p-3 rounded-lg">
                    {order.clientDescription}
                  </p>
                </div>
                {order.diagnosis && (
                  <div>
                    <p className="text-sm font-medium text-textSecondary mb-2">
                      Диагноза:
                    </p>
                    <p className="text-textPrimary bg-mainBg p-3 rounded-lg">
                      {order.diagnosis}
                    </p>
                  </div>
                )}
                {order.notes && (
                  <div>
                    <p className="text-sm font-medium text-textSecondary mb-2">
                      Бележки:
                    </p>
                    <p className="text-textPrimary bg-mainBg p-3 rounded-lg">
                      {order.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-cardBg rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-semibold text-textPrimary mb-4">
                Детайли на поръчката
              </h2>
              {order.orderItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-borderSubtle">
                        <th className="text-left py-2 px-3 text-sm font-semibold text-textPrimary">Тип</th>
                        <th className="text-left py-2 px-3 text-sm font-semibold text-textPrimary">Описание</th>
                        <th className="text-right py-2 px-3 text-sm font-semibold text-textPrimary">Кол.</th>
                        <th className="text-right py-2 px-3 text-sm font-semibold text-textPrimary">Ед. цена</th>
                        <th className="text-right py-2 px-3 text-sm font-semibold text-textPrimary">Общо</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.orderItems.map((item) => (
                        <tr key={item.id} className="border-b border-borderSubtle">
                          <td className="py-3 px-3">{getItemTypeBadge(item.type)}</td>
                          <td className="py-3 px-3 text-textPrimary">{item.description}</td>
                          <td className="py-3 px-3 text-right text-textSecondary">{item.quantity}</td>
                          <td className="py-3 px-3 text-right text-textSecondary">
                            {Number(item.unitPrice || 0).toFixed(2)} лв
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-textPrimary">
                            {Number(item.totalPrice || 0).toFixed(2)} лв
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={4} className="py-3 px-3 text-right font-semibold text-textPrimary">
                          Обща сума:
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-primary text-lg">
                          {Number(order.totalPrice || 0).toFixed(2)} лв
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-textSecondary">
                  Все още няма добавени услуги или части
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Дати */}
            <div className="bg-cardBg rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-semibold text-textPrimary mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Дати
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-textSecondary">Създадена на</p>
                  <p className="font-medium text-textPrimary">
                    {new Date(order.createdAt).toLocaleString('bg-BG')}
                  </p>
                </div>
                {order.startDate && (
                  <div>
                    <p className="text-sm text-textSecondary">Начална дата</p>
                    <p className="font-medium text-textPrimary">
                      {new Date(order.startDate).toLocaleDateString('bg-BG')}
                    </p>
                  </div>
                )}
                {order.endDate && (
                  <div>
                    <p className="text-sm text-textSecondary">Очаквана дата</p>
                    <p className="font-medium text-textPrimary">
                      {new Date(order.endDate).toLocaleDateString('bg-BG')}
                    </p>
                  </div>
                )}
                {order.completedAt && (
                  <div>
                    <p className="text-sm text-textSecondary">Завършена на</p>
                    <p className="font-medium text-textPrimary">
                      {new Date(order.completedAt).toLocaleString('bg-BG')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Плащане */}
            <div className="bg-cardBg rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-semibold text-textPrimary mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Плащане
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-textSecondary">Статус</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      order.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {order.isPaid ? 'Платена' : 'Неплатена'}
                  </span>
                </div>
                {order.paymentMethod && (
                  <div>
                    <p className="text-sm text-textSecondary">Метод</p>
                    <p className="font-medium text-textPrimary">{order.paymentMethod}</p>
                  </div>
                )}
                {order.paidAt && (
                  <div>
                    <p className="text-sm text-textSecondary">Платена на</p>
                    <p className="font-medium text-textPrimary">
                      {new Date(order.paidAt).toLocaleDateString('bg-BG')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-textSecondary">Обща сума</p>
                  <div className="text-2xl font-bold text-primary">
                  <div>{Number(order.totalPrice || 0).toFixed(2)} лв</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Finalize Modal */}
      {order && (
        <FinalizeOrderModal
          isOpen={showFinalizeModal}
          onClose={() => setShowFinalizeModal(false)}
          onConfirm={handleFinalize}
          orderNumber={order.orderNumber}
          orderItems={order.orderItems}
          totalPrice={order.totalPrice}
          clientEmail={order.client.user?.email || order.client.email || ''}
        />
      )}
    </MainLayout>
  );
};

export default OrderDetails;