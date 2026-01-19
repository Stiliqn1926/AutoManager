import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Car,
  Calendar,
  Gauge,
  Hash,
  Palette,
  ClipboardList,
  Wrench,
  FileText,
  User,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useServiceCompany } from '../../hooks/useServiceCompany';

interface OrderItem {
  id: string;
  type: 'PART' | 'LABOR' | 'CONSUMABLE';
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  issueDate: string;
  dueDate: string | null;
  isPaid: boolean;
  paidDate: string | null;
}

interface ServiceHistoryOrder {
  id: string;
  orderNumber: string;
  description: string;
  status: string;
  totalPrice: string | number | null;
  endDate: string | null;
  completedDate: string | null;
  createdAt: string;
  worker: string | null;
  items: OrderItem[];
  invoice: Invoice | null;
}

interface VehicleDetailsResponse {
  vehicle: {
    id: string;
    brand: string;
    model: string;
    year: number | null;
    licensePlate: string;
    vin: string | null;
    color: string | null;
    mileage: number | null;
    status?: string | null;
    createdAt: string;
    updatedAt: string;
    serviceHistory: ServiceHistoryOrder[];
  };
}

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedServiceCompany } = useServiceCompany();

  const [data, setData] = useState<VehicleDetailsResponse['vehicle'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVehicle = async () => {
    if (!id) return;

    if (!selectedServiceCompany) {
      toast.error('Няма избран сервиз');
      navigate('/client/service-companies');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get<VehicleDetailsResponse>(`/client/vehicles/${id}`, {
        params: { serviceCompanyId: selectedServiceCompany.id },
      });

      setData(response.data.vehicle);
    } catch (error) {
      toast.error('Грешка при зареждане на автомобил');
     
      console.error('Client vehicle details error:', error);
      navigate('/client/vehicles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, selectedServiceCompany?.id]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      WAITING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      READY: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };

    const labels: Record<string, string> = {
      WAITING: 'Изчакване',
      IN_PROGRESS: 'В процес',
      READY: 'Готов',
      COMPLETED: 'Завършен',
      CANCELLED: 'Отказан',
    };

    return (
      <span
        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
          styles[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('bg-BG', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatMoney = (value: string | number | null) => {
    if (value === null || value === undefined) return '—';
    const num = typeof value === 'string' ? Number(value) : value;
    if (Number.isNaN(num)) return String(value);
    return `${num.toFixed(2)} лв.`;
  };

  const sumItems = (items: OrderItem[]) =>
    items.reduce((acc, it) => acc + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0), 0);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!data) {
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
            aria-label="Назад към автомобилите"
            title="Назад"
            onClick={() => navigate('/client/vehicles')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-textPrimary">
              {data.brand} {data.model}
            </h1>
            <p className="text-textSecondary mt-1">{data.licensePlate}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle info */}
            <div className="bg-cardBg rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-semibold mb-4">Информация за автомобила</h2>
              <div className="grid grid-cols-2 gap-4">
                <Info icon={<Car />} label="Марка / Модел" value={`${data.brand} ${data.model}`} />
                {data.year !== null && <Info icon={<Calendar />} label="Година" value={data.year} />}
                {data.mileage !== null && (
                  <Info icon={<Gauge />} label="Пробег" value={`${data.mileage.toLocaleString()} км`} />
                )}
                {data.vin && <Info icon={<Hash />} label="VIN" value={data.vin} />}
                {data.color && <Info icon={<Palette />} label="Цвят" value={data.color} />}
              </div>
            </div>

            {/* Service history */}
            <div className="bg-cardBg rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Сервизна история
              </h2>

              {data.serviceHistory.length === 0 ? (
                <p className="text-textSecondary">Няма история на обслужване</p>
              ) : (
                <div className="space-y-3">
                  {data.serviceHistory.map((order) => {
                    const computedTotal = sumItems(order.items);
                    const displayedTotal =
                      order.totalPrice !== null && order.totalPrice !== undefined
                        ? formatMoney(order.totalPrice)
                        : computedTotal > 0
                        ? formatMoney(computedTotal)
                        : '—';

                    return (
                      <div key={order.id} className="p-4 bg-mainBg rounded-lg border border-borderSubtle">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-textPrimary">{order.orderNumber}</span>
                              {getStatusBadge(order.status)}
                            </div>

                            <p className="text-sm text-textSecondary">{order.description}</p>

                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-textMuted">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(order.createdAt)}
                              </span>

                              {order.worker && (
                                <span className="inline-flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  {order.worker}
                                </span>
                              )}

                              {order.endDate && (
                                <span className="inline-flex items-center gap-1">
                                  <Wrench className="w-4 h-4" />
                                  Очаквана: {formatDate(order.endDate)}
                                </span>
                              )}

                              {order.completedDate && (
                                <span className="inline-flex items-center gap-1">
                                  <Wrench className="w-4 h-4" />
                                  Завършена: {formatDate(order.completedDate)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-semibold text-textPrimary">{displayedTotal}</div>
                            {order.invoice ? (
                              <div className="mt-1 inline-flex items-center gap-1 text-xs text-textSecondary">
                                <FileText className="w-4 h-4" />
                                Фактура: {order.invoice.invoiceNumber}{' '}
                                {order.invoice.isPaid ? '(платена)' : '(неплатена)'}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* Items */}
                        {order.items.length > 0 ? (
                          <div className="mt-4 border-t border-borderSubtle pt-4">
                            <div className="text-sm font-semibold text-textPrimary mb-2">Дейности / Части</div>
                            <div className="space-y-2">
                              {order.items.map((it) => (
                                <div
                                  key={it.id}
                                  className="flex items-start justify-between gap-4 text-sm"
                                >
                                  <div className="min-w-0">
                                    <div className="text-textPrimary font-medium">{it.description}</div>
                                    <div className="text-textMuted">
                                      {it.type} • {it.quantity} × {formatMoney(it.unitPrice)}
                                    </div>
                                  </div>
                                  <div className="text-textPrimary font-semibold shrink-0">
                                    {formatMoney((Number(it.unitPrice) || 0) * (Number(it.quantity) || 0))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="space-y-6">
            <div className="bg-cardBg rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-semibold mb-4">Дати</h2>
              <div className="space-y-3">
                <Info label="Добавен на" value={formatDate(data.createdAt)} />
                <Info label="Последна промяна" value={formatDate(data.updatedAt)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

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
