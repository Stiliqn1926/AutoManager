import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Mail, Phone, Wrench } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  specialization: string | null;
  skills: string | null;
  createdAt: string;
  membershipStatus: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  joinedAt: string;
  leftAt: string | null;
  user: {
    email: string;
  };
}

interface WorkerOrder {
  id: string;
  orderNumber: string;
  displayOrderNumber: string | null;
  status: string;
  createdAt: string;
  isPaid: boolean;
  client: {
    firstName: string;
    lastName: string;
  };
  vehicle: {
    brand: string;
    model: string;
    licensePlate: string | null;
  };
}

const WorkerDetails = () => {
  const { id } = useParams();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [orders, setOrders] = useState<WorkerOrder[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorker = async () => {
      try {
        const response = await api.get(`/workers/${id}`);
        setWorker(response.data.worker);
      } catch {
        toast.error('Грешка при зареждане на работник');
        navigate('/admin/workers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorker();
  }, [id, navigate]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!id) return;

      try {
        const response = await api.get('/orders', {
          params: { workerId: id, limit: 100 },
        });
        setOrders(response.data.orders || []);
      } catch {
        toast.error('Грешка при зареждане на поръчки');
      } finally {
        setIsOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [id]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      WAITING: 'Изчакване',
      IN_PROGRESS: 'В процес',
      READY: 'Готова за плащане',
      COMPLETED: 'Платена',
      CANCELLED: 'Отказана',
    };

    const colors: Record<string, string> = {
      WAITING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      READY: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {map[status] || status}
      </span>
    );
  };

  const handleDelete = async () => {
    if (!worker) return;

    const isActive = worker.membershipStatus === 'ACTIVE';
    const confirmMessage = isActive
      ? `Сигурни ли сте, че искате да премахнете ${worker.firstName} ${worker.lastName} от сервиза?`
      : `Сигурни ли сте, че искате да изтриете напълно ${worker.firstName} ${worker.lastName}?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      if (isActive) {
        // Премахни от сервиз (маркирай като INACTIVE)
        await api.post(`/workers/${id}/remove-from-service`);
        toast.success('Механикът е премахнат от сервиза');
      } else {
        // Изтрий напълно
        await api.delete(`/workers/${id}/permanent`);
        toast.success('Механикът е изтрит напълно');
      }
      navigate('/admin/workers');
    } catch (error) {
      const apiMessage = (error as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      const fallbackMessage =
        error instanceof Error ? error.message : 'Грешка при операцията';
      toast.error(apiMessage || fallbackMessage);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!worker) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-textSecondary">Работникът не е намерен</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/admin/workers')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors w-fit"
            aria-label="Назад към списъка с работници"
            title="Назад"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>

          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">
              {worker.firstName} {worker.lastName}
            </h1>
            <p className="text-textSecondary mt-1">
              Детайли за работник
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button variant="danger" onClick={handleDelete} className="w-full sm:w-auto">
              <Trash2 className="w-4 h-4" />
              {worker.membershipStatus === 'ACTIVE' ? 'Премахни от сервиз' : 'Изтрий'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">
                Основна информация
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-textMuted" />
                  <div>
                    <p className="text-sm text-textSecondary">Email</p>
                    <p className="font-medium text-textPrimary">
                      {worker.user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-textMuted" />
                  <div>
                    <p className="text-sm text-textSecondary">Телефон</p>
                    <p className="font-medium text-textPrimary">
                      {worker.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Wrench className="w-5 h-5 text-textMuted" />
                  <div>
                    <p className="text-sm text-textSecondary">
                      Специализация
                    </p>
                    <p className="font-medium text-textPrimary">
                      {worker.specialization || 'Не е посочена'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {worker.skills && (
              <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">
                  Умения
                </h2>
                <p className="text-textSecondary">{worker.skills}</p>
              </div>
            )}

            <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">
                Поръчки на механика
              </h2>

              {isOrdersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                </div>
              ) : orders.length === 0 ? (
                <p className="text-textSecondary">Няма поръчки за този механик</p>
              ) : (
                <div className="space-y-2">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                      className="p-3 bg-mainBg rounded-lg hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div>
                          <p className="font-medium">
                            {order.displayOrderNumber || order.orderNumber}
                          </p>
                          <p className="text-sm text-textSecondary">
                            {order.client.firstName} {order.client.lastName} •{" "}
                            {order.vehicle.brand} {order.vehicle.model}
                            {order.vehicle.licensePlate
                              ? ` (${order.vehicle.licensePlate})`
                              : ""}
                          </p>
                          <p className="text-sm text-textSecondary">
                            {new Date(order.createdAt).toLocaleDateString("bg-BG")}
                          </p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">
                Статистика
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-textSecondary">
                    Дата на наемане
                  </p>
                  <p className="font-medium text-textPrimary">
                    {new Date(worker.createdAt).toLocaleDateString('bg-BG')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default WorkerDetails;



