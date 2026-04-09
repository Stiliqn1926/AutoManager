import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Car,
  ClipboardList,
  Calendar,
  Package,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { getMechanicClientById } from '../../services/mechanicService';
import type { MechanicClientDetails } from '../../types/mechanic';
import toast from 'react-hot-toast';

const MechanicClientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<MechanicClientDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClientDetails = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const data = await getMechanicClientById(id);
      setClient(data.client);
    } catch {
      toast.error('Грешка при зареждане на данни');
      navigate('/mechanic/clients');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchClientDetails();
  }, [fetchClientDetails]);

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
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}
      >
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

  if (!client) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-textSecondary">Клиентът не е намерен</p>
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
            onClick={() => navigate('/mechanic/clients')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors w-fit"
            aria-label="Назад към списък с клиенти"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">
              {client.firstName} {client.lastName}
            </h1>
            <p className="text-textSecondary mt-1">Информация за клиента</p>
          </div>
        </div>

        
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">
              Основна информация
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            
            <div>
              <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                <Phone className="w-4 h-4" />
                <span>Телефон</span>
              </div>
              <a
                href={`tel:${client.phone}`}
                className="text-base font-medium text-primary hover:underline"
              >
                {client.phone}
              </a>
            </div>

            {/* Email */}
            {(client.email || client.user?.email) && (
              <div>
                <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </div>
                <a
                  href={`mailto:${client.email || client.user?.email}`}
                  className="text-base font-medium text-primary hover:underline"
                >
                  {client.email || client.user?.email}
                </a>
              </div>
            )}

            
            {client.address && (
              <div className="sm:col-span-2">
                <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                  <MapPin className="w-4 h-4" />
                  <span>Адрес</span>
                </div>
                <p className="text-base text-textPrimary">{client.address}</p>
              </div>
            )}
          </div>
        </div>

        
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card">
          <div className="p-4 sm:p-6 border-b border-borderSubtle">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" />
                <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">
                  Автомобили
                </h2>
              </div>
              <span className="text-sm text-textSecondary">
                Общо:{' '}
                <span className="font-semibold text-textPrimary">
                  {client.vehicles.length}
                </span>
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {client.vehicles.length === 0 ? (
              <div className="text-center py-8 text-textSecondary">
                <Car className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Няма регистрирани автомобили</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {client.vehicles.map((vehicle) => {
                  return (
                    <div
                      key={vehicle.id}
                      className="p-3 sm:p-4 rounded-lg border border-borderSubtle bg-mainBg cursor-pointer transition-colors hover:border-primary"
                      onClick={() =>
                        navigate(`/mechanic/vehicles/${vehicle.id}`)
                      }
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-base font-semibold text-textPrimary">
                            {vehicle.brand} {vehicle.model}
                          </h3>
                          <p className="text-sm text-textSecondary">
                            {vehicle.year} - {vehicle.licensePlate}
                          </p>
                        </div>
                      </div>
                      {vehicle.vin && (
                        <p className="text-xs text-textSecondary">
                          VIN: {vehicle.vin}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card">
          <div className="p-4 sm:p-6 border-b border-borderSubtle">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">
                  Поръчки
                </h2>
              </div>
              <span className="text-sm text-textSecondary">
                Общо:{' '}
                <span className="font-semibold text-textPrimary">
                  {client.orders.length}
                </span>
              </span>
            </div>
          </div>

          {client.orders.length === 0 ? (
            <div className="text-center py-12 text-textSecondary">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Няма поръчки</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-borderSubtle">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Номер / Дата
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Автомобил
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Описание
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Действие
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderSubtle">
                  {client.orders.map((order) => (
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
                      <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-textSecondary" />
                          <div>
                            {order.vehicle ? (
                              <>
                                <div className="text-sm font-medium text-textPrimary">
                                  {order.vehicle.brand} {order.vehicle.model}
                                </div>
                                <div className="text-xs text-textSecondary">
                                  {order.vehicle.licensePlate}
                                </div>
                              </>
                            ) : (
                              <div className="text-sm text-textSecondary italic">
                                Няма превозно средство
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4">
                        <div className="text-sm text-textPrimary max-w-xs truncate">
                          {order.description || 'Няма описание'}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
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

const ClientDetailsPage = MechanicClientDetails;
export default ClientDetailsPage;

