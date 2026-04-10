import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Car,
  User,
  Phone,
  Calendar,
  FileText,
  Package,
  Wrench,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import {
  getMechanicOrderById,
  updateMechanicOrderStatus,
  updateMechanicOrder,
} from '../../services/mechanicService';
import type { MechanicOrderDetails } from '../../types/mechanic';
import toast from 'react-hot-toast';
import { POLLING_INTERVALS } from '../../config/polling';

const MechanicOrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<MechanicOrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [diagnosis, setDiagnosis] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const activeRequestRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);

  const fetchOrderDetails = useCallback(
    async (options?: { silent?: boolean; redirectOnError?: boolean }) => {
      if (!id) return;

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
        const data = await getMechanicOrderById(id, controller.signal);

        if (requestSeq !== requestSeqRef.current) {
          return;
        }

        setOrder(data.order);
        setDiagnosis((currentDiagnosis) =>
          isEditingNotes ? currentDiagnosis : data.order.diagnosis || ''
        );
      } catch (error: unknown) {
        if (
          axios.isCancel(error) ||
          (error instanceof Error && error.name === 'AbortError')
        ) {
          return;
        }

        if (!silent) {
          toast.error('\u0413\u0440\u0435\u0448\u043a\u0430 \u043f\u0440\u0438 \u0437\u0430\u0440\u0435\u0436\u0434\u0430\u043d\u0435 \u043d\u0430 \u0434\u0430\u043d\u043d\u0438');
        }

        if (redirectOnError) {
          navigate('/mechanic/orders');
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
    [id, isEditingNotes, navigate]
  );

  useEffect(() => {
    void fetchOrderDetails({ silent: false, redirectOnError: true });

    const refreshSilently = () => {
      if (document.visibilityState === 'visible') {
        void fetchOrderDetails({ silent: true, redirectOnError: false });
      }
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchOrderDetails({ silent: true, redirectOnError: false });
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
  }, [fetchOrderDetails]);

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;

    try {
      await updateMechanicOrderStatus(id, newStatus);
      toast.success('Статусът е обновен успешно');
      void fetchOrderDetails({ silent: true, redirectOnError: false });
    } catch {
      toast.error('Грешка при обновяване на статуса');
    }
  };

  const handleSaveDiagnosticNotes = async () => {
    if (!id) return;

    try {
      await updateMechanicOrder(id, { diagnosis });
      toast.success('Диагностичните бележки са запазени');
      setIsEditingNotes(false);
      void fetchOrderDetails({ silent: true, redirectOnError: false });
    } catch {
      toast.error('Грешка при запазване на бележките');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      WAITING: { label: 'Чакащ', className: 'bg-yellow-100 text-yellow-800' },
      IN_PROGRESS: { label: 'В процес', className: 'bg-blue-100 text-blue-800' },
      READY: { label: 'Готов', className: 'bg-green-100 text-green-800' },
      COMPLETED: { label: 'Завършен', className: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canChangeStatus = (currentStatus: string, newStatus: string): boolean => {
    const transitions: Record<string, string[]> = {
      WAITING: ['IN_PROGRESS'],
      IN_PROGRESS: ['READY', 'WAITING'],
      READY: ['IN_PROGRESS'],
    };
    return transitions[currentStatus]?.includes(newStatus) || false;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
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

  const laborItems = order.orderItems.filter((item) => item.type === 'LABOR');
  const partItems = order.orderItems.filter((item) => item.type === 'PART' || item.type === 'CONSUMABLE');

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/mechanic/orders')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors w-fit"
            aria-label="Назад към списък с поръчки"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">
              Поръчка {order.displayOrderNumber || order.orderNumber}
            </h1>
            <p className="text-textSecondary mt-1">Детайли за поръчката</p>
          </div>
          {getStatusBadge(order.status)}
        </div>

        
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">Основна информация</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            
            <div>
              <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                <Car className="w-4 h-4" />
                <span>Автомобил</span>
              </div>
              <button
                onClick={() => navigate(`/mechanic/vehicles/${order.vehicle.id}`)}
                className="text-base font-medium text-primary hover:underline text-left"
              >
                {order.vehicle.brand} {order.vehicle.model} ({order.vehicle.licensePlate})
              </button>
            </div>

            
            <div>
              <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                <User className="w-4 h-4" />
                <span>Клиент</span>
              </div>
              <div>
                <button
                  onClick={() => navigate(`/mechanic/clients/${order.client.id}`)}
                  className="text-base font-medium text-primary hover:underline"
                >
                  {order.client.firstName} {order.client.lastName}
                </button>
                {order.client.phone && (
                  <div className="text-sm text-textSecondary flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" />
                    <a href={`tel:${order.client.phone}`} className="hover:underline">
                      {order.client.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            
            <div>
              <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                <Calendar className="w-4 h-4" />
                <span>Дата на създаване</span>
              </div>
              <p className="text-base text-textPrimary">{formatDate(order.createdAt)}</p>
            </div>

            
            {order.worker && (
              <div>
                <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                  <Wrench className="w-4 h-4" />
                  <span>Механик</span>
                </div>
                <p className="text-base text-textPrimary">
                  {order.worker.firstName} {order.worker.lastName}
                </p>
              </div>
            )}
          </div>
        </div>

        
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">Описание на проблема</h2>
          </div>

          <div className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-2">
                Първоначално описание
              </label>
              <p className="text-base text-textPrimary bg-gray-50 p-3 sm:p-4 rounded-lg">
                {order.description || 'Няма описание'}
              </p>
            </div>

            
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <label className="block text-sm font-medium text-textSecondary">
                  Диагностични бележки
                </label>
                {!isEditingNotes && order.status !== 'COMPLETED' && (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="text-sm text-primary hover:text-primary-700 flex items-center gap-1 w-fit"
                  >
                    <Edit2 className="w-4 h-4" />
                    Редактирай
                  </button>
                )}
              </div>

              {isEditingNotes ? (
                <div className="space-y-2">
                  <textarea
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Въведи диагностични бележки..."
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleSaveDiagnosticNotes}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 w-full sm:w-auto"
                    >
                      <Save className="w-4 h-4" />
                      Запази
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingNotes(false);
                        setDiagnosis(order.diagnosis || '');
                      }}
                      className="px-4 py-2 bg-gray-200 text-textPrimary rounded-lg hover:bg-gray-300 flex items-center gap-2 w-full sm:w-auto"
                    >
                      <X className="w-4 h-4" />
                      Отказ
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-base text-textPrimary bg-gray-50 p-3 sm:p-4 rounded-lg">
                  {diagnosis || 'Няма диагностични бележки'}
                </p>
              )}
            </div>
          </div>
        </div>

        
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card">
          <div className="p-4 sm:p-6 border-b border-borderSubtle">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">Дейности (Труд)</h2>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {laborItems.length === 0 ? (
              <div className="text-center py-8 text-textSecondary">
                <Wrench className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Няма добавени дейности</p>
              </div>
            ) : (
              <div className="space-y-3">
                {laborItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-borderSubtle"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-textPrimary">{item.name}</h3>
                        {item.description && item.description !== item.name && (
                          <p className="text-sm text-textSecondary mt-1">{item.description}</p>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-sm text-textSecondary">
                          <span>Количество: {item.quantity}</span>
                          <span>Цена: {Number(item.unitPrice || 0).toFixed(2)} €</span>
                          <span className="font-semibold text-textPrimary">
                            Общо: {Number(item.totalPrice || 0).toFixed(2)} €
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card">
          <div className="p-4 sm:p-6 border-b border-borderSubtle">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">Части и консумативи</h2>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {partItems.length === 0 ? (
              <div className="text-center py-8 text-textSecondary">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Няма добавени части</p>
              </div>
            ) : (
              <div className="space-y-3">
                {partItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-borderSubtle"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-textPrimary">{item.name}</h3>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                            {item.type === 'PART' ? 'Част' : 'Консуматив'}
                          </span>
                        </div>
                        {item.description && item.description !== item.name && (
                          <p className="text-sm text-textSecondary mt-1">{item.description}</p>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-sm text-textSecondary">
                          <span>Количество: {item.quantity}</span>
                          <span>Цена: {Number(item.unitPrice || 0).toFixed(2)} €</span>
                          <span className="font-semibold text-textPrimary">
                            Общо: {Number(item.totalPrice || 0).toFixed(2)} €
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">Статус на поръчката</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-2">
                Текущ статус
              </label>
              {getStatusBadge(order.status)}
            </div>

            {order.status !== 'COMPLETED' && (
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-2">
                  Промени статус
                </label>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                  {canChangeStatus(order.status, 'IN_PROGRESS') && (
                    <button
                      onClick={() => handleStatusChange('IN_PROGRESS')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto"
                    >
                      Започни работа
                    </button>
                  )}
                  {canChangeStatus(order.status, 'READY') && (
                    <button
                      onClick={() => handleStatusChange('READY')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 w-full sm:w-auto"
                    >
                      Маркирай като готово
                    </button>
                  )}
                  {canChangeStatus(order.status, 'WAITING') && (
                    <button
                      onClick={() => handleStatusChange('WAITING')}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 w-full sm:w-auto"
                    >
                      Върни в чакащи
                    </button>
                  )}
                </div>
              </div>
            )}

            {order.totalPrice !== null && (
              <div className="pt-4 border-t border-borderSubtle">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-lg font-medium text-textSecondary">Обща стойност:</span>
                  <span className="text-2xl font-bold text-primary">{Number(order.totalPrice || 0).toFixed(2)} €</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

const OrderDetails = MechanicOrderDetails;
export default OrderDetails;

