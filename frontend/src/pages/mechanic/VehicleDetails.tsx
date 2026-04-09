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
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° Ð´Ð°Ð½Ð½Ð¸');
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
      WAITING: { label: 'Ð§Ð°ÐºÐ°Ñ‰', className: 'bg-yellow-100 text-yellow-800' },
      IN_PROGRESS: { label: 'Ð’ Ð¿Ñ€Ð¾Ñ†ÐµÑ', className: 'bg-blue-100 text-blue-800' },
      READY: { label: 'Ð“Ð¾Ñ‚Ð¾Ð²', className: 'bg-green-100 text-green-800' },
      COMPLETED: { label: 'Ð—Ð°Ð²ÑŠÑ€ÑˆÐµÐ½', className: 'bg-gray-100 text-gray-800' },
      CANCELLED: { label: 'ÐžÑ‚Ð¼ÐµÐ½ÐµÐ½', className: 'bg-red-100 text-red-800' },
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
      LOW: { label: 'ÐÐ¸ÑÑŠÐº', className: 'bg-gray-100 text-gray-600' },
      NORMAL: { label: 'ÐÐ¾Ñ€Ð¼Ð°Ð»ÐµÐ½', className: 'bg-blue-100 text-blue-700' },
      MEDIUM: { label: 'Ð¡Ñ€ÐµÐ´ÐµÐ½', className: 'bg-blue-100 text-blue-700' },
      HIGH: { label: 'Ð’Ð¸ÑÐ¾Ðº', className: 'bg-orange-100 text-orange-700' },
      URGENT: { label: 'Ð¡Ð¿ÐµÑˆÐµÐ½', className: 'bg-red-100 text-red-700' },
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
          <p className="text-textSecondary">ÐÐ²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»ÑŠÑ‚ Ð½Ðµ Ðµ Ð½Ð°Ð¼ÐµÑ€ÐµÐ½</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/mechanic/vehicles')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors w-fit"
            aria-label="ÐÐ°Ð·Ð°Ð´ ÐºÑŠÐ¼ ÑÐ¿Ð¸ÑÑŠÐº Ñ Ð°Ð²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»Ð¸"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">
              {vehicle.brand} {vehicle.model}
            </h1>
            <p className="text-textSecondary mt-1">{vehicle.licensePlate}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Car className="w-5 h-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">ÐžÑÐ½Ð¾Ð²Ð½Ð¸ Ð´Ð°Ð½Ð½Ð¸</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                <Car className="w-4 h-4" />
                <span>ÐœÐ°Ñ€ÐºÐ° Ð¸ Ð¼Ð¾Ð´ÐµÐ»</span>
              </div>
              <p className="text-base font-medium text-textPrimary">
                {vehicle.brand} {vehicle.model}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                <Calendar className="w-4 h-4" />
                <span>Ð“Ð¾Ð´Ð¸Ð½Ð°</span>
              </div>
              <p className="text-base text-textPrimary">{vehicle.year}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                <Hash className="w-4 h-4" />
                <span>Ð ÐµÐ³. Ð½Ð¾Ð¼ÐµÑ€</span>
              </div>
              <p className="text-base font-medium text-textPrimary">
                {vehicle.licensePlate}
              </p>
            </div>

            {vehicle.vin && (
              <div className="sm:col-span-2 lg:col-span-3">
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
                  <span>Ð“Ð¾Ñ€Ð¸Ð²Ð¾</span>
                </div>
                <p className="text-base text-textPrimary">{vehicle.fuelType}</p>
              </div>
            )}

            {vehicle.engineType && (
              <div>
                <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                  <Wrench className="w-4 h-4" />
                  <span>Ð”Ð²Ð¸Ð³Ð°Ñ‚ÐµÐ»</span>
                </div>
                <p className="text-base text-textPrimary">{vehicle.engineType}</p>
              </div>
            )}

            {vehicle.mileage && (
              <div>
                <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                  <Gauge className="w-4 h-4" />
                  <span>ÐšÐ¸Ð»Ð¾Ð¼ÐµÑ‚Ñ€Ð°Ð¶</span>
                </div>
                <p className="text-base text-textPrimary">
                  {vehicle.mileage.toLocaleString()} ÐºÐ¼
                </p>
              </div>
            )}

            {vehicle.color && (
              <div>
                <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                  <Palette className="w-4 h-4" />
                  <span>Ð¦Ð²ÑÑ‚</span>
                </div>
                <p className="text-base text-textPrimary">{vehicle.color}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">ÐšÐ»Ð¸ÐµÐ½Ñ‚</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                <User className="w-4 h-4" />
                <span>Ð˜Ð¼Ðµ Ð¸ Ñ„Ð°Ð¼Ð¸Ð»Ð¸Ñ</span>
              </div>
              <p className="text-base font-medium text-textPrimary">
                {vehicle.client.firstName} {vehicle.client.lastName}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                <Phone className="w-4 h-4" />
                <span>Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½</span>
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

            <div className="sm:col-span-2">
              <button
                onClick={() =>
                  navigate(`/mechanic/clients/${vehicle.client.id}`)
                }
                className="px-4 py-2 bg-gray-100 text-textPrimary rounded-lg hover:bg-gray-200 text-sm font-medium w-full sm:w-auto"
              >
                Ð’Ð¸Ð¶ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð°
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card">
          <div className="p-4 sm:p-6 border-b border-borderSubtle">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">ÐŸÐ¾Ñ€ÑŠÑ‡ÐºÐ¸</h2>
              </div>
              <span className="text-sm text-textSecondary">
                ÐžÐ±Ñ‰Ð¾:{' '}
                <span className="font-semibold text-textPrimary">
                  {vehicle.orders.length}
                </span>
              </span>
            </div>
          </div>

          {vehicle.orders.length === 0 ? (
            <div className="text-center py-12 text-textSecondary">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>ÐÑÐ¼Ð° Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ¸</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-borderSubtle">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      ÐÐ¾Ð¼ÐµÑ€ / Ð”Ð°Ñ‚Ð°
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸Ðµ
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Ð¡Ñ‚Ð°Ñ‚ÑƒÑ
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      ÐŸÑ€Ð¸Ð¾Ñ€Ð¸Ñ‚ÐµÑ‚
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Ð”ÐµÑ‚Ð°Ð¹Ð»Ð¸
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Ð”ÐµÐ¹ÑÑ‚Ð²Ð¸Ðµ
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
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-textPrimary">
                            {order.displayOrderNumber || order.orderNumber}
                          </div>
                          <div className="text-xs text-textSecondary flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4">
                        <div className="text-sm text-textPrimary max-w-xs truncate">
                          {order.description || 'ÐÑÐ¼Ð° Ð¾Ð¿Ð¸ÑÐ°Ð½Ð¸Ðµ'}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {getPriorityBadge(order.priority)}
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                          <Package className="w-3 h-3" />
                          {order.orderItems.length} Ð´ÐµÐ¹Ð½Ð¾ÑÑ‚Ð¸
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/mechanic/orders/${order.id}`);
                          }}
                          className="text-primary hover:text-primary-700 text-sm font-medium"
                        >
                          ÐžÑ‚Ð²Ð¾Ñ€Ð¸
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

