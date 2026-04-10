import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
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
  Check,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';
import FinalizeOrderModal from './FinalizeOrderModal';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { POLLING_INTERVALS } from '../../config/polling';

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
  displayOrderNumber: string | null;
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
  createdAt: string;
  updatedAt: string;
  invoices?: {
    invoiceNumber: string;
  }[];
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
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
  const activeRequestRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);
  const navigate = useNavigate();

  const fetchOrder = useCallback(
    async (options?: { silent?: boolean; redirectOnError?: boolean }) => {
      if (!id) {
        return;
      }

      const silent = options?.silent ?? false;
      const redirectOnError = options?.redirectOnError ?? !silent;
      const requestSeq = requestSeqRef.current + 1;
      requestSeqRef.current = requestSeq;

      activeRequestRef.current?.abort();
      const controller = new AbortController();
      activeRequestRef.current = controller;

      if (!silent) {
        setIsLoading(true);
      }

      try {
        const response = await api.get(`/orders/${id}`, {
          signal: controller.signal,
        });

        if (requestSeq !== requestSeqRef.current) {
          return;
        }

        setOrder(response.data.order);
      } catch (error: unknown) {
        if (
          axios.isCancel(error) ||
          (error instanceof Error && error.name === 'AbortError')
        ) {
          return;
        }

        if (!silent) {
          toast.error('\u0413\u0440\u0435\u0448\u043a\u0430 \u043f\u0440\u0438 \u0437\u0430\u0440\u0435\u0436\u0434\u0430\u043d\u0435 \u043d\u0430 \u043f\u043e\u0440\u044a\u0447\u043a\u0430');
        }

        if (redirectOnError) {
          navigate('/admin/orders');
        }
      } finally {
        if (requestSeq === requestSeqRef.current) {
          if (!silent) {
            setIsLoading(false);
          }

          if (activeRequestRef.current === controller) {
            activeRequestRef.current = null;
          }
        }
      }
    },
    [id, navigate]
  );

  useEffect(() => {
    void fetchOrder({ silent: false, redirectOnError: true });

    const refreshSilently = () => {
      if (document.visibilityState === 'visible') {
        void fetchOrder({ silent: true, redirectOnError: false });
      }
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchOrder({ silent: true, redirectOnError: false });
      }
    }, POLLING_INTERVALS.details);

    window.addEventListener('focus', refreshSilently);
    document.addEventListener('visibilitychange', refreshSilently);

    return () => {
      activeRequestRef.current?.abort();
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshSilently);
      document.removeEventListener('visibilitychange', refreshSilently);
    };
  }, [fetchOrder]);

  const handleDelete = async () => {
    if (!order) return;
    if (!confirm(`Сигурни ли сте, че искате да изтриете поръчка ${order.displayOrderNumber || order.orderNumber}?`)) return;

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
      toast.success('\u0424\u0430\u043a\u0442\u0443\u0440\u0430\u0442\u0430 \u0435 \u0433\u0435\u043d\u0435\u0440\u0438\u0440\u0430\u043d\u0430 \u0438 \u0438\u0437\u043f\u0440\u0430\u0442\u0435\u043d\u0430');
      await fetchOrder({ silent: true, redirectOnError: false });
    } catch {
      toast.error('\u0413\u0440\u0435\u0448\u043a\u0430 \u043f\u0440\u0438 \u0444\u0438\u043d\u0430\u043b\u0438\u0437\u0438\u0440\u0430\u043d\u0435');
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
      READY: 'Готова за плащане',
      COMPLETED: 'Платена',
      CANCELLED: 'Отказана',
    };
    return (
      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${styles[status as keyof typeof styles]}`}>
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
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <button
            onClick={() => navigate('/admin/orders')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors w-fit"
            aria-label="Назад към поръчки"
            title="Назад към поръчки"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>

          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary" title={`Системен ID: ${order.orderNumber}`}>
              Поръчка {order.displayOrderNumber || order.orderNumber}
            </h1>
            <p className="text-textSecondary mt-1">{getStatusBadge(order.status)}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {order.invoices && order.invoices.length > 0 ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg w-full sm:w-auto">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Фактурата е изпратена</span>
              </div>
            ) : (
              (order.status === 'IN_PROGRESS' || order.status === 'READY' || order.status === 'COMPLETED') && (
                <Button onClick={() => setShowFinalizeModal(true)} className="w-full sm:w-auto">
                  <FileText className="w-4 h-4" />
                  {order.status === 'COMPLETED' ? 'Издай фактура' : 'Финализирай и изпрати фактура'}
                </Button>
              )
            )}
            {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
              <Button onClick={() => navigate(`/admin/orders/${id}/edit`)} className="w-full sm:w-auto">
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
            
            <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
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

            
            <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
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

            
            {order.worker && (
              <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
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

            
            <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
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
            <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
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
                          <th className="hidden sm:table-cell text-right py-2 px-3 text-sm font-semibold text-textPrimary whitespace-nowrap">Кол.</th>
                          <th className="hidden sm:table-cell text-right py-2 px-3 text-sm font-semibold text-textPrimary whitespace-nowrap">Ед. цена</th>
                          <th className="text-right py-2 px-3 text-sm font-semibold text-textPrimary whitespace-nowrap">Общо</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.orderItems.map((item) => (
                        <tr key={item.id} className="border-b border-borderSubtle">
                          <td className="py-3 px-3">{getItemTypeBadge(item.type)}</td>
                          <td className="py-3 px-3 text-textPrimary">{item.description}</td>
                          <td className="hidden sm:table-cell py-3 px-3 text-right text-textSecondary whitespace-nowrap">{item.quantity}</td>
                          <td className="hidden sm:table-cell py-3 px-3 text-right text-textSecondary whitespace-nowrap">{Number(item.unitPrice || 0).toFixed(2)} €
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-textPrimary whitespace-nowrap">
                            {Number(item.totalPrice || 0).toFixed(2)} €
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={4} className="py-3 px-3 text-right font-semibold text-textPrimary">
                          Обща сума:
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-primary text-lg whitespace-nowrap">
                          {Number(order.totalPrice || 0).toFixed(2)} €
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

          <div className="space-y-4 sm:space-y-6">
            
            <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
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
                    <p className="text-sm text-textSecondary">Краен срок</p>
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

            
            <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-textPrimary mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Плащане
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-textSecondary">Статус</p>
                  <span
                    className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
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
                  <div className="text-2xl font-bold text-primary whitespace-nowrap">
                    {Number(order.totalPrice || 0).toFixed(2)} €
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
          orderNumber={order.displayOrderNumber || order.orderNumber}
          orderItems={order.orderItems}
          totalPrice={order.totalPrice}
          clientEmail={order.client.user?.email || order.client.email || ''}
        />
      )}
    </MainLayout>
  );
};

export default OrderDetails;




