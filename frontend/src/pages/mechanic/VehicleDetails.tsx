import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Car,
  Calendar,
  Gauge,
  Droplet,
  Palette,
  Hash,
  User,
  Phone,
  Mail,
  ClipboardList,
  Package,
  Wrench,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { getMechanicVehicleById } from '../../services/mechanicService';
import type { MechanicVehicleDetails } from '../../types/mechanic';
import toast from 'react-hot-toast';

const MechanicVehicleDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<MechanicVehicleDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVehicleDetails = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const data = await getMechanicVehicleById(id);
      setVehicle(data.vehicle);
    } catch {
      toast.error('Грешка при зареждане на данни');
      navigate('/mechanic/vehicles');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchVehicleDetails();
  }, [fetchVehicleDetails]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      WAITING: { label: 'Чакащ', className: 'bg-yellow-100 text-yellow-800' },
      IN_PROGRESS: { label: 'В процес', className: 'bg-blue-100 text-blue-800' },
      READY: { label: 'Готов', className: 'bg-green-100 text-green-800' },
      COMPLETED: { label: 'Завършен', className: 'bg-gray-100 text-gray-800' },
      CANCELLED: { label: 'Отменен', className: 'bg-red-100 text-red-800' },
    };

    const config =
      statusConfig[status] || {
        label: status,
        className: 'bg-gray-100 text-gray-800',
      };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { label: string; className: string }> = {
      LOW: { label: 'Нисък', className: 'bg-gray-100 text-gray-600' },
      MEDIUM: { label: 'Среден', className: 'bg-blue-100 text-blue-700' },
      HIGH: { label: 'Висок', className: 'bg-orange-100 text-orange-700' },
      URGENT: { label: 'Спешен', className: 'bg-red-100 text-red-700' },
    };

    const config =
      priorityConfig[priority] || {
        label: priority,
        className: 'bg-gray-100 text-gray-600',
      };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
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
    });
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
            onClick={() => navigate('/mechanic/vehicles')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Назад към списък с автомобили"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-textPrimary">
              {vehicle.brand} {vehicle.model}
            </h1>
            <p className="text-textSecondary mt-1">{vehicle.licensePlate}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Car className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-textPrimary">Основни данни</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                <Car className="w-4 h-4" />
                <span>Марка и модел</span>
              </div>
              <p className="text-base font-medium text-textPrimary">
                {vehicle.brand} {vehicle.model}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                <Calendar className="w-4 h-4" />
                <span>Година</span>
              </div>
              <p className="text-base text-textPrimary">{vehicle.year}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                <Hash className="w-4 h-4" />
                <span>Рег. номер</span>
              </div>
              <p className="text-base font-medium text-textPrimary">
                {vehicle.licensePlate}
              </p>
            </div>

            {vehicle.vin && (
              <div className="md:col-span-3">
                <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                  <Hash className="w-4 h-4" />
                  <span>VIN</span>
                </div>
                <p className="text-base text-textPrimary font-mono">{vehicle.vin}</p>
              </div>
            )}

            {vehicle.fuelType && (
              <div>
                <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                  <Droplet className="w-4 h-4" />
                  <span>Гориво</span>
                </div>
                <p className="text-base text-textPrimary">{vehicle.fuelType}</p>
              </div>
            )}

            {vehicle.engineType && (
              <div>
                <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                  <Wrench className="w-4 h-4" />
                  <span>Двигател</span>
                </div>
                <p className="text-base text-textPrimary">{vehicle.engineType}</p>
              </div>
            )}

            {vehicle.mileage && (
              <div>
                <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                  <Gauge className="w-4 h-4" />
                  <span>Километраж</span>
                </div>
                <p className="text-base text-textPrimary">
                  {vehicle.mileage.toLocaleString()} км
                </p>
              </div>
            )}

            {vehicle.color && (
              <div>
                <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                  <Palette className="w-4 h-4" />
                  <span>Цвят</span>
                </div>
                <p className="text-base text-textPrimary">{vehicle.color}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-textPrimary">Клиент</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                <User className="w-4 h-4" />
                <span>Име и фамилия</span>
              </div>
              <p className="text-base font-medium text-textPrimary">
                {vehicle.client.firstName} {vehicle.client.lastName}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                <Phone className="w-4 h-4" />
                <span>Телефон</span>
              </div>
              <a
                href={`tel:${vehicle.client.phone}`}
                className="text-base font-medium text-primary hover:underline"
              >
                {vehicle.client.phone}
              </a>
            </div>

            {vehicle.client.email && (
              <div>
                <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </div>
                <a
                  href={`mailto:${vehicle.client.email}`}
                  className="text-base font-medium text-primary hover:underline"
                >
                  {vehicle.client.email}
                </a>
              </div>
            )}

            <div className="md:col-span-2">
              <button
                onClick={() =>
                  navigate(`/mechanic/clients/${vehicle.client.id}`)
                }
                className="px-4 py-2 bg-gray-100 text-textPrimary rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                Виж клиента
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card">
          <div className="p-6 border-b border-borderSubtle">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-textPrimary">Поръчки</h2>
              </div>
              <span className="text-sm text-textSecondary">
                Общо:{' '}
                <span className="font-semibold text-textPrimary">
                  {vehicle.orders.length}
                </span>
              </span>
            </div>
          </div>

          {vehicle.orders.length === 0 ? (
            <div className="text-center py-12 text-textSecondary">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Няма поръчки</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-borderSubtle">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Номер / Дата
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Описание
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Приоритет
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Детайли
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Действие
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderSubtle">
                  {vehicle.orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        navigate(`/mechanic/orders/${order.id}`)
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-textPrimary">
                            {order.orderNumber}
                          </div>
                          <div className="text-xs text-textSecondary flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-textPrimary max-w-xs truncate">
                          {order.description || 'Няма описание'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPriorityBadge(order.priority)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                          <Package className="w-3 h-3" />
                          {order.orderItems.length} дейности
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/mechanic/orders/${order.id}`);
                          }}
                          className="text-primary hover:text-primary-700 text-sm font-medium"
                        >
                          Отвори
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

const VehicleDetails = MechanicVehicleDetails;
export default VehicleDetails;
