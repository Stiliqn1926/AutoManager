import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Car,
  User,
  Calendar,
  Gauge,
  Hash,
  Palette,
  ClipboardList,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  licensePlate: string;
  vin: string | null;
  color: string | null;
  mileage: number | null;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    user: {
      email: string;
    };
  };
  orders?: Array<{
    id: string;
    orderNumber: string;
    displayOrderNumber: string | null;
    status: string;
    createdAt: string;
    totalPrice: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const response = await api.get(`/vehicles/${id}`);
        setVehicle(response.data.vehicle);
      } catch {
        toast.error('Грешка при зареждане на автомобил');
        navigate('/admin/vehicles');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicle();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!vehicle) return;

    if (!window.confirm(`Сигурни ли сте, че искате да изтриете ${vehicle.licensePlate}?`)) {
      return;
    }

    try {
      await api.delete(`/vehicles/${id}`);
      toast.success('Автомобилът е изтрит');
      navigate('/admin/vehicles');
    } catch {
      toast.error('Грешка при изтриване');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      WAITING: 'text-yellow-700',
      IN_PROGRESS: 'text-blue-700',
      READY: 'text-green-700',
      COMPLETED: 'text-gray-600',
    };

    const labels: Record<string, string> = {
      WAITING: 'Изчакване',
      IN_PROGRESS: 'В процес',
      READY: 'Готова за плащане',
      COMPLETED: 'Платена',
    };

    return (
      <span className={`text-sm font-medium ${styles[status] || 'text-gray-600'}`}>
        {labels[status] || status}
      </span>
    );
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

  if (!vehicle) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-textSecondary">Автомобилът не е намерен</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Назад към списъка с автомобили"
            title="Назад"
            onClick={() => navigate('/admin/vehicles')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-textPrimary">
              {vehicle.brand} {vehicle.model}
            </h1>
            <p className="text-textSecondary mt-1">{vehicle.licensePlate}</p>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => navigate(`/admin/vehicles/${id}/edit`)}>
              <Edit className="w-4 h-4" />
              Редактирай
            </Button>
            {(!vehicle.orders || vehicle.orders.length === 0) && (
              <Button variant="danger" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" />
                Изтрий
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle info */}
            <div className="bg-cardBg rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-semibold mb-4">Информация за автомобила</h2>
              <div className="grid grid-cols-2 gap-4">
                <Info icon={<Car />} label="Марка / Модел" value={`${vehicle.brand} ${vehicle.model}`} />
                {vehicle.year && <Info icon={<Calendar />} label="Година" value={vehicle.year} />}
                {vehicle.mileage !== null && (
                  <Info
                    icon={<Gauge />}
                    label="Пробег"
                    value={`${vehicle.mileage.toLocaleString()} км`}
                  />
                )}
                {vehicle.vin && <Info icon={<Hash />} label="VIN" value={vehicle.vin} />}
                {vehicle.color && <Info icon={<Palette />} label="Цвят" value={vehicle.color} />}
              </div>
            </div>

            {/* Owner */}
            <div className="bg-cardBg rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Собственик
              </h2>
              <div
                onClick={() => navigate(`/admin/clients/${vehicle.client.id}`)}
                className="p-4 bg-mainBg rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <p className="font-medium">
                  {vehicle.client.firstName} {vehicle.client.lastName}
                </p>
                <p className="text-sm text-textSecondary">{vehicle.client.phone}</p>
                <p className="text-sm text-textSecondary">{vehicle.client.user?.email || 'Няма email'}</p>
              </div>
            </div>

            {/* Orders */}
            <div className="bg-cardBg rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Сервизна история
              </h2>

              {vehicle.orders && vehicle.orders.length > 0 ? (
                <div className="space-y-2">
                  {vehicle.orders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                      className="p-4 bg-mainBg rounded-lg hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{order.displayOrderNumber || order.orderNumber}</p>
                          <p className="text-sm text-textSecondary">
                            {new Date(order.createdAt).toLocaleDateString('bg-BG')}
                          </p>
                          <p className="font-medium">{Number(order.totalPrice || 0).toFixed(2)} €</p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-textSecondary">Няма история на обслужване</p>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="space-y-6">
            <div className="bg-cardBg rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-semibold mb-4">Информация</h2>
              <div className="space-y-3">
                <Info
                  label="Добавен на"
                  value={new Date(vehicle.createdAt).toLocaleDateString('bg-BG')}
                />
                <Info
                  label="Последна промяна"
                  value={new Date(vehicle.updatedAt).toLocaleDateString('bg-BG')}
                />
                <Info label="Брой поръчки" value={vehicle.orders?.length || 0} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

/* Helper */
const Info = ({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-center gap-3">
    {icon && <div className="text-textMuted">{icon}</div>}
    <div>
      <p className="text-sm text-textSecondary">{label}</p>
      <div className="font-medium text-textPrimary">{value}</div>
    </div>
  </div>
);

export default VehicleDetails;
