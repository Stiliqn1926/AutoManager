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
        toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° Ñ€Ð°Ð±Ð¾Ñ‚Ð½Ð¸Ðº');
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
        toast.error('Ãâ€œÃ‘â‚¬ÃÂµÃ‘Ë†ÃÂºÃÂ° ÃÂ¿Ã‘â‚¬ÃÂ¸ ÃÂ·ÃÂ°Ã‘â‚¬ÃÂµÃÂ¶ÃÂ´ÃÂ°ÃÂ½ÃÂµ ÃÂ½ÃÂ° ÃÂ¿ÃÂ¾Ã‘â‚¬Ã‘Å Ã‘â€¡ÃÂºÃÂ¸');
      } finally {
        setIsOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [id]);

  const handleDelete = async () => {
    if (!worker) return;

    const isActive = worker.membershipStatus === 'ACTIVE';
    const confirmMessage = isActive
      ? `Ð¡Ð¸Ð³ÑƒÑ€Ð½Ð¸ Ð»Ð¸ ÑÑ‚Ðµ, Ñ‡Ðµ Ð¸ÑÐºÐ°Ñ‚Ðµ Ð´Ð° Ð¿Ñ€ÐµÐ¼Ð°Ñ…Ð½ÐµÑ‚Ðµ ${worker.firstName} ${worker.lastName} Ð¾Ñ‚ ÑÐµÑ€Ð²Ð¸Ð·Ð°?`
      : `Ð¡Ð¸Ð³ÑƒÑ€Ð½Ð¸ Ð»Ð¸ ÑÑ‚Ðµ, Ñ‡Ðµ Ð¸ÑÐºÐ°Ñ‚Ðµ Ð´Ð° Ð¸Ð·Ñ‚Ñ€Ð¸ÐµÑ‚Ðµ Ð½Ð°Ð¿ÑŠÐ»Ð½Ð¾ ${worker.firstName} ${worker.lastName}?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      if (isActive) {
        // ÐŸÑ€ÐµÐ¼Ð°Ñ…Ð½Ð¸ Ð¾Ñ‚ ÑÐµÑ€Ð²Ð¸Ð· (Ð¼Ð°Ñ€ÐºÐ¸Ñ€Ð°Ð¹ ÐºÐ°Ñ‚Ð¾ INACTIVE)
        await api.post(`/workers/${id}/remove-from-service`);
        toast.success('ÐœÐµÑ…Ð°Ð½Ð¸ÐºÑŠÑ‚ Ðµ Ð¿Ñ€ÐµÐ¼Ð°Ñ…Ð½Ð°Ñ‚ Ð¾Ñ‚ ÑÐµÑ€Ð²Ð¸Ð·Ð°');
      } else {
        // Ð˜Ð·Ñ‚Ñ€Ð¸Ð¹ Ð½Ð°Ð¿ÑŠÐ»Ð½Ð¾
        await api.delete(`/workers/${id}/permanent`);
        toast.success('ÐœÐµÑ…Ð°Ð½Ð¸ÐºÑŠÑ‚ Ðµ Ð¸Ð·Ñ‚Ñ€Ð¸Ñ‚ Ð½Ð°Ð¿ÑŠÐ»Ð½Ð¾');
      }
      navigate('/admin/workers');
    } catch (error) {
      const apiMessage = (error as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      const fallbackMessage =
        error instanceof Error ? error.message : 'Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¾Ð¿ÐµÑ€Ð°Ñ†Ð¸ÑÑ‚Ð°';
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
          <p className="text-textSecondary">Ð Ð°Ð±Ð¾Ñ‚Ð½Ð¸ÐºÑŠÑ‚ Ð½Ðµ Ðµ Ð½Ð°Ð¼ÐµÑ€ÐµÐ½</p>
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
            aria-label="ÐÐ°Ð·Ð°Ð´ ÐºÑŠÐ¼ ÑÐ¿Ð¸ÑÑŠÐºÐ° Ñ Ñ€Ð°Ð±Ð¾Ñ‚Ð½Ð¸Ñ†Ð¸"
            title="ÐÐ°Ð·Ð°Ð´"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>

          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">
              {worker.firstName} {worker.lastName}
            </h1>
            <p className="text-textSecondary mt-1">
              Ð”ÐµÑ‚Ð°Ð¹Ð»Ð¸ Ð·Ð° Ñ€Ð°Ð±Ð¾Ñ‚Ð½Ð¸Ðº
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button variant="danger" onClick={handleDelete} className="w-full sm:w-auto">
              <Trash2 className="w-4 h-4" />
              {worker.membershipStatus === 'ACTIVE' ? 'ÐŸÑ€ÐµÐ¼Ð°Ñ…Ð½Ð¸ Ð¾Ñ‚ ÑÐµÑ€Ð²Ð¸Ð·' : 'Ð˜Ð·Ñ‚Ñ€Ð¸Ð¹'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">
                ÐžÑÐ½Ð¾Ð²Ð½Ð° Ð¸Ð½Ñ„Ð¾Ñ€Ð¼Ð°Ñ†Ð¸Ñ
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
                    <p className="text-sm text-textSecondary">Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½</p>
                    <p className="font-medium text-textPrimary">
                      {worker.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Wrench className="w-5 h-5 text-textMuted" />
                  <div>
                    <p className="text-sm text-textSecondary">
                      Ð¡Ð¿ÐµÑ†Ð¸Ð°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ñ
                    </p>
                    <p className="font-medium text-textPrimary">
                      {worker.specialization || 'ÐÐµ Ðµ Ð¿Ð¾ÑÐ¾Ñ‡ÐµÐ½Ð°'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {worker.skills && (
              <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">
                  Ð£Ð¼ÐµÐ½Ð¸Ñ
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
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-borderSubtle text-left text-xs sm:text-sm font-semibold text-textSecondary">
                        <th className="py-2 px-3">Поръчка</th>
                        <th className="py-2 px-3">Клиент</th>
                        <th className="py-2 px-3">Автомобил</th>
                        <th className="py-2 px-3">Статус</th>
                        <th className="py-2 px-3">Създадена</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-borderSubtle text-sm text-textPrimary hover:bg-mainBg cursor-pointer"
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                        >
                          <td className="py-2 px-3 font-medium">
                            {order.displayOrderNumber || order.orderNumber}
                          </td>
                          <td className="py-2 px-3 text-textSecondary">
                            {order.client.firstName} {order.client.lastName}
                          </td>
                          <td className="py-2 px-3 text-textSecondary">
                            {order.vehicle.brand} {order.vehicle.model}
                            {order.vehicle.licensePlate ? ` (${order.vehicle.licensePlate})` : ""}
                          </td>
                          <td className="py-2 px-3 text-textSecondary">{order.status}</td>
                          <td className="py-2 px-3 text-textSecondary">
                            {new Date(order.createdAt).toLocaleDateString("bg-BG")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">
                Ð¡Ñ‚Ð°Ñ‚Ð¸ÑÑ‚Ð¸ÐºÐ°
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-textSecondary">
                    Ð”Ð°Ñ‚Ð° Ð½Ð° Ð½Ð°ÐµÐ¼Ð°Ð½Ðµ
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



