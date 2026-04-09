import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  UserX,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  Car,
  ClipboardList,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  user?: {
    email: string;
  } | null;
  vehicles?: {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
  }[];
  orders?: {
    id: string;
    orderNumber: string;
    displayOrderNumber: string | null;
    status: string;
    createdAt: string;
  }[];
}

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await api.get(`/clients/${id}`);
        setClient(response.data.client);
      } catch {
        toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° ÐºÐ»Ð¸ÐµÐ½Ñ‚');
        navigate('/admin/clients');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClient();
  }, [id, navigate]);

  const handleToggleStatus = async () => {
    if (!client) return;

    const action = client.isActive ? 'Ð´ÐµÐ°ÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ñ‚Ðµ' : 'Ð°ÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ñ‚Ðµ';
    if (
      !window.confirm(
        `Ð¡Ð¸Ð³ÑƒÑ€Ð½Ð¸ Ð»Ð¸ ÑÑ‚Ðµ, Ñ‡Ðµ Ð¸ÑÐºÐ°Ñ‚Ðµ Ð´Ð° ${action} ${client.firstName} ${client.lastName}?`
      )
    )
      return;

    try {
      await api.patch(`/clients/${id}/toggle-active`);
      toast.success(
        `ÐšÐ»Ð¸ÐµÐ½Ñ‚ÑŠÑ‚ Ðµ ${client.isActive ? 'Ð´ÐµÐ°ÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ð½' : 'Ð°ÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ð½'}`
      );
      setClient({ ...client, isActive: !client.isActive });
    } catch {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¿Ñ€Ð¾Ð¼ÑÐ½Ð° Ð½Ð° ÑÑ‚Ð°Ñ‚ÑƒÑ');
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-12 w-12 border-b-2 border-primary rounded-full" />
        </div>
      </MainLayout>
    );
  }

  if (!client) {
    return (
      <MainLayout>
        <p className="text-center text-textSecondary py-12">
          ÐšÐ»Ð¸ÐµÐ½Ñ‚ÑŠÑ‚ Ð½Ðµ Ðµ Ð½Ð°Ð¼ÐµÑ€ÐµÐ½
        </p>
      </MainLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    const map = {
      WAITING: 'Ð˜Ð·Ñ‡Ð°ÐºÐ²Ð°Ð½Ðµ',
      IN_PROGRESS: 'Ð’ Ð¿Ñ€Ð¾Ñ†ÐµÑ',
      READY: 'Ð“Ð¾Ñ‚Ð¾Ð²Ð° Ð·Ð° Ð¿Ð»Ð°Ñ‰Ð°Ð½Ðµ',
      COMPLETED: 'ÐŸÐ»Ð°Ñ‚ÐµÐ½Ð°',
    };

    const colors = {
      WAITING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      READY: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[status as keyof typeof colors]
        }`}
      >
        {map[status as keyof typeof map]}
      </span>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <button
            type="button"
            aria-label="ÐÐ°Ð·Ð°Ð´ ÐºÑŠÐ¼ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¸"
            title="ÐÐ°Ð·Ð°Ð´"
            onClick={() => navigate('/admin/clients')}
            className="p-2 rounded-lg hover:bg-gray-100 w-fit"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>

          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">
              {client.firstName} {client.lastName}
            </h1>
            <p className="text-textSecondary">Ð”ÐµÑ‚Ð°Ð¹Ð»Ð¸ Ð·Ð° ÐºÐ»Ð¸ÐµÐ½Ñ‚</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              variant={client.isActive ? 'danger' : 'success'}
              onClick={handleToggleStatus}
              className="w-full sm:w-auto"
            >
              {client.isActive ? (
                <>
                  <UserX className="w-4 h-4" />
                  Ð”ÐµÐ°ÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ð¹
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  ÐÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ð¹
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Info */}
            <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">ÐžÑÐ½Ð¾Ð²Ð½Ð° Ð¸Ð½Ñ„Ð¾Ñ€Ð¼Ð°Ñ†Ð¸Ñ</h2>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Mail className="w-5 h-5 text-textMuted" />
                  <div>
                    <p className="text-sm text-textSecondary">Email</p>
                    <p className="font-medium">
                      {client.user?.email || client.email || 'ÐÑÐ¼Ð° email'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Phone className="w-5 h-5 text-textMuted" />
                  <div>
                    <p className="text-sm text-textSecondary">Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½</p>
                    <p className="font-medium">{client.phone}</p>
                  </div>
                </div>

                {client.address && (
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <MapPin className="w-5 h-5 text-textMuted" />
                    <div>
                      <p className="text-sm text-textSecondary">ÐÐ´Ñ€ÐµÑ</p>
                      <p className="font-medium">{client.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicles */}
            <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
              <h2 className="flex items-center gap-2 font-semibold mb-4">
                <Car className="w-5 h-5" />
                ÐÐ²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»Ð¸
              </h2>

              {client.vehicles?.length ? (
                <div className="space-y-2">
                  {client.vehicles.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => navigate(`/admin/vehicles/${v.id}`)}
                      className="p-3 bg-mainBg rounded-lg hover:bg-gray-100 cursor-pointer"
                    >
                      <p className="font-medium">
                        {v.brand} {v.model}
                      </p>
                      <p className="text-sm text-textSecondary">
                        {v.licensePlate}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-textSecondary">
                  ÐÑÐ¼Ð° Ñ€ÐµÐ³Ð¸ÑÑ‚Ñ€Ð¸Ñ€Ð°Ð½Ð¸ Ð°Ð²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»Ð¸
                </p>
              )}
            </div>

            {/* Orders */}
            <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
              <h2 className="flex items-center gap-2 font-semibold mb-4">
                <ClipboardList className="w-5 h-5" />
                ÐŸÐ¾Ñ€ÑŠÑ‡ÐºÐ¸
              </h2>

              {client.orders?.length ? (
                <div className="space-y-2">
                  {client.orders.slice(0, 5).map((o) => (
                    <div
                      key={o.id}
                      onClick={() => navigate(`/admin/orders/${o.id}`)}
                      className="p-3 bg-mainBg rounded-lg hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div>
                          <p className="font-medium">{o.displayOrderNumber || o.orderNumber}</p>
                          <p className="text-sm text-textSecondary">
                            {new Date(o.createdAt).toLocaleDateString('bg-BG')}
                          </p>
                        </div>
                        {getStatusBadge(o.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-textSecondary">ÐÑÐ¼Ð° Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ¸</p>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
            <h2 className="font-semibold mb-4">Ð¡Ñ‚Ð°Ñ‚Ð¸ÑÑ‚Ð¸ÐºÐ°</h2>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-textSecondary">Ð ÐµÐ³Ð¸ÑÑ‚Ñ€Ð°Ñ†Ð¸Ñ</p>
                <p className="font-medium">
                  {new Date(client.createdAt).toLocaleDateString('bg-BG')}
                </p>
              </div>

              <div>
                <p className="text-sm text-textSecondary">Ð¡Ñ‚Ð°Ñ‚ÑƒÑ</p>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    client.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {client.isActive ? 'ÐÐºÑ‚Ð¸Ð²ÐµÐ½' : 'ÐÐµÐ°ÐºÑ‚Ð¸Ð²ÐµÐ½'}
                </span>
              </div>

              <div>
                <p className="text-sm text-textSecondary">ÐÐ²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»Ð¸</p>
                <p className="font-medium">{client.vehicles?.length || 0}</p>
              </div>

              <div>
                <p className="text-sm text-textSecondary">ÐŸÐ¾Ñ€ÑŠÑ‡ÐºÐ¸</p>
                <p className="font-medium">{client.orders?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ClientDetails;


