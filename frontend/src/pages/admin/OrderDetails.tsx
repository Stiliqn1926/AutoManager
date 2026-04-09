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
        if (requestSeq !== requestSeqRef.current) {
          return;
        }

        if (!silent) {
          setIsLoading(false);
        }

        if (activeRequestRef.current === controller) {
          activeRequestRef.current = null;
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
    if (!confirm(`Ð¡Ð¸Ð³ÑƒÑ€Ð½Ð¸ Ð»Ð¸ ÑÑ‚Ðµ, Ñ‡Ðµ Ð¸ÑÐºÐ°Ñ‚Ðµ Ð´Ð° Ð¸Ð·Ñ‚Ñ€Ð¸ÐµÑ‚Ðµ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ° ${order.displayOrderNumber || order.orderNumber}?`)) return;

    try {
      await api.delete(`/orders/${id}`);
      toast.success('ÐŸÐ¾Ñ€ÑŠÑ‡ÐºÐ°Ñ‚Ð° Ðµ Ð¸Ð·Ñ‚Ñ€Ð¸Ñ‚Ð°');
      navigate('/admin/orders');
    } catch {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¸Ð·Ñ‚Ñ€Ð¸Ð²Ð°Ð½Ðµ');
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
      WAITING: 'Ð˜Ð·Ñ‡Ð°ÐºÐ²Ð°Ð½Ðµ',
      IN_PROGRESS: 'Ð’ Ð¿Ñ€Ð¾Ñ†ÐµÑ',
      READY: 'Ð“Ð¾Ñ‚Ð¾Ð²Ð° Ð·Ð° Ð¿Ð»Ð°Ñ‰Ð°Ð½Ðµ',
      COMPLETED: 'ÐŸÐ»Ð°Ñ‚ÐµÐ½Ð°',
      CANCELLED: 'ÐžÑ‚ÐºÐ°Ð·Ð°Ð½Ð°',
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
      LABOR: 'Ð£ÑÐ»ÑƒÐ³Ð°',
      PART: 'Ð§Ð°ÑÑ‚',
      CONSUMABLE: 'ÐšÐ¾Ð½ÑÑƒÐ¼Ð°Ñ‚Ð¸Ð²',
      OTHER: 'Ð”Ñ€ÑƒÐ³Ð¾',
    };
    const displayType = type || 'OTHER';
    const label = labels[displayType] || displayType || 'ÐÐµÐ¸Ð·Ð²ÐµÑÑ‚Ð½Ð¾';
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
          <p className="text-textSecondary">ÐŸÐ¾Ñ€ÑŠÑ‡ÐºÐ°Ñ‚Ð° Ð½Ðµ Ðµ Ð½Ð°Ð¼ÐµÑ€ÐµÐ½Ð°</p>
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
            aria-label="ÐÐ°Ð·Ð°Ð´ ÐºÑŠÐ¼ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ¸"
            title="ÐÐ°Ð·Ð°Ð´ ÐºÑŠÐ¼ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ¸"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>

          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary" title={`Ð¡Ð¸ÑÑ‚ÐµÐ¼ÐµÐ½ ID: ${order.orderNumber}`}>
              ÐŸÐ¾Ñ€ÑŠÑ‡ÐºÐ° {order.displayOrderNumber || order.orderNumber}
            </h1>
            <p className="text-textSecondary mt-1">{getStatusBadge(order.status)}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {order.invoices && order.invoices.length > 0 ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg w-full sm:w-auto">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Ð¤Ð°ÐºÑ‚ÑƒÑ€Ð°Ñ‚Ð° Ðµ Ð¸Ð·Ð¿Ñ€Ð°Ñ‚ÐµÐ½Ð°</span>
              </div>
            ) : (
              (order.status === 'IN_PROGRESS' || order.status === 'READY' || order.status === 'COMPLETED') && (
                <Button onClick={() => setShowFinalizeModal(true)} className="w-full sm:w-auto">
                  <FileText className="w-4 h-4" />
                  {order.status === 'COMPLETED' ? 'Ð˜Ð·Ð´Ð°Ð¹ Ñ„Ð°ÐºÑ‚ÑƒÑ€Ð°' : 'Ð¤Ð¸Ð½Ð°Ð»Ð¸Ð·Ð¸Ñ€Ð°Ð¹ Ð¸ Ð¸Ð·Ð¿Ñ€Ð°Ñ‚Ð¸ Ñ„Ð°ÐºÑ‚ÑƒÑ€Ð°'}
                </Button>
              )
            )}
            {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
              <Button onClick={() => navigate(`/admin/orders/${id}/edit`)} className="w-full sm:w-auto">
                <Edit className="w-4 h-4" />
                Ð ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð°Ð¹
              </Button>
            )}
            <Button variant="danger" onClick={handleDelete} className="w-full sm:w-auto">
              <Trash2 className="w-4 h-4" />
              Ð˜Ð·Ñ‚Ñ€Ð¸Ð¹
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-textPrimary mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                ÐšÐ»Ð¸ÐµÐ½Ñ‚
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
                ÐÐ²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»
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
                  ÐœÐµÑ…Ð°Ð½Ð¸Ðº
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
                ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸Ðµ Ð¸ Ð´Ð¸Ð°Ð³Ð½Ð¾Ð·Ð°
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-textSecondary mb-2">
                    ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸Ðµ Ð¾Ñ‚ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð°:
                  </p>
                  <p className="text-textPrimary bg-mainBg p-3 rounded-lg">
                    {order.clientDescription}
                  </p>
                </div>
                {order.diagnosis && (
                  <div>
                    <p className="text-sm font-medium text-textSecondary mb-2">
                      Ð”Ð¸Ð°Ð³Ð½Ð¾Ð·Ð°:
                    </p>
                    <p className="text-textPrimary bg-mainBg p-3 rounded-lg">
                      {order.diagnosis}
                    </p>
                  </div>
                )}
                {order.notes && (
                  <div>
                    <p className="text-sm font-medium text-textSecondary mb-2">
                      Ð‘ÐµÐ»ÐµÐ¶ÐºÐ¸:
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
                Ð”ÐµÑ‚Ð°Ð¹Ð»Ð¸ Ð½Ð° Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ°Ñ‚Ð°
              </h2>
              {order.orderItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-borderSubtle">
                        <th className="text-left py-2 px-3 text-sm font-semibold text-textPrimary">Ð¢Ð¸Ð¿</th>
                        <th className="text-left py-2 px-3 text-sm font-semibold text-textPrimary">ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸Ðµ</th>
                        <th className="hidden sm:table-cell text-right py-2 px-3 text-sm font-semibold text-textPrimary">ÐšÐ¾Ð».</th>
                        <th className="hidden sm:table-cell text-right py-2 px-3 text-sm font-semibold text-textPrimary">Ð•Ð´. Ñ†ÐµÐ½Ð°</th>
                        <th className="text-right py-2 px-3 text-sm font-semibold text-textPrimary">ÐžÐ±Ñ‰Ð¾</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.orderItems.map((item) => (
                        <tr key={item.id} className="border-b border-borderSubtle">
                          <td className="py-3 px-3">{getItemTypeBadge(item.type)}</td>
                          <td className="py-3 px-3 text-textPrimary">{item.description}</td>
                          <td className="hidden sm:table-cell py-3 px-3 text-right text-textSecondary">{item.quantity}</td>
                          <td className="hidden sm:table-cell py-3 px-3 text-right text-textSecondary">{Number(item.unitPrice || 0).toFixed(2)} â‚¬
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-textPrimary">
                            {Number(item.totalPrice || 0).toFixed(2)} â‚¬
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={4} className="py-3 px-3 text-right font-semibold text-textPrimary">
                          ÐžÐ±Ñ‰Ð° ÑÑƒÐ¼Ð°:
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-primary text-lg">
                          {Number(order.totalPrice || 0).toFixed(2)} â‚¬
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-textSecondary">
                  Ð’ÑÐµ Ð¾Ñ‰Ðµ Ð½ÑÐ¼Ð° Ð´Ð¾Ð±Ð°Ð²ÐµÐ½Ð¸ ÑƒÑÐ»ÑƒÐ³Ð¸ Ð¸Ð»Ð¸ Ñ‡Ð°ÑÑ‚Ð¸
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            
            <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-textPrimary mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Ð”Ð°Ñ‚Ð¸
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-textSecondary">Ð¡ÑŠÐ·Ð´Ð°Ð´ÐµÐ½Ð° Ð½Ð°</p>
                  <p className="font-medium text-textPrimary">
                    {new Date(order.createdAt).toLocaleString('bg-BG')}
                  </p>
                </div>
                {order.startDate && (
                  <div>
                    <p className="text-sm text-textSecondary">ÐÐ°Ñ‡Ð°Ð»Ð½Ð° Ð´Ð°Ñ‚Ð°</p>
                    <p className="font-medium text-textPrimary">
                      {new Date(order.startDate).toLocaleDateString('bg-BG')}
                    </p>
                  </div>
                )}
                {order.endDate && (
                  <div>
                    <p className="text-sm text-textSecondary">ÐšÑ€Ð°ÐµÐ½ ÑÑ€Ð¾Ðº</p>
                    <p className="font-medium text-textPrimary">
                      {new Date(order.endDate).toLocaleDateString('bg-BG')}
                    </p>
                  </div>
                )}
                {order.completedAt && (
                  <div>
                    <p className="text-sm text-textSecondary">Ð—Ð°Ð²ÑŠÑ€ÑˆÐµÐ½Ð° Ð½Ð°</p>
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
                ÐŸÐ»Ð°Ñ‰Ð°Ð½Ðµ
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-textSecondary">Ð¡Ñ‚Ð°Ñ‚ÑƒÑ</p>
                  <span
                    className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                      order.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {order.isPaid ? 'ÐŸÐ»Ð°Ñ‚ÐµÐ½Ð°' : 'ÐÐµÐ¿Ð»Ð°Ñ‚ÐµÐ½Ð°'}
                  </span>
                </div>
                {order.paymentMethod && (
                  <div>
                    <p className="text-sm text-textSecondary">ÐœÐµÑ‚Ð¾Ð´</p>
                    <p className="font-medium text-textPrimary">{order.paymentMethod}</p>
                  </div>
                )}
                {order.paidAt && (
                  <div>
                    <p className="text-sm text-textSecondary">ÐŸÐ»Ð°Ñ‚ÐµÐ½Ð° Ð½Ð°</p>
                    <p className="font-medium text-textPrimary">
                      {new Date(order.paidAt).toLocaleDateString('bg-BG')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-textSecondary">ÐžÐ±Ñ‰Ð° ÑÑƒÐ¼Ð°</p>
                  <div className="text-2xl font-bold text-primary">
                  <div>{Number(order.totalPrice || 0).toFixed(2)} â‚¬</div>
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




