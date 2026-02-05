import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  User,
  Car,
  ClipboardList,
  FileText,
  Package,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface OrderItem {
  id: string;
  type: 'PART' | 'LABOR' | 'CONSUMABLE';
  name: string;
  description: string | null;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  subtotal: string;
  tax: string;
  total: string;
  issueDate: string;
  dueDate: string | null;
  isPaid: boolean;
  paidDate: string | null;
}

interface OrderDetailsData {
  order: {
    id: string;
    orderNumber: string;
    displayOrderNumber?: string | null;
    description: string;
    diagnosis: string | null;
    status: string;
    priority: string;
    totalPrice: string | null;
    startDate: string | null;
    endDate: string | null;
    completedDate: string | null;
    createdAt: string;
    updatedAt: string;
    notes: string | null;
    vehicle: {
      id: string;
      brand: string;
      model: string;
      licensePlate: string;
      year: number | null;
    };
    worker: string | null;
    items: OrderItem[];
    invoice: Invoice | null;
  };
}

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<OrderDetailsData['order'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrder = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const response = await api.get<OrderDetailsData>(`/client/orders/${id}`);
      setData(response.data.order);
    } catch (error) {
      toast.error('Грешка при зареждане на поръчка');
      console.error('Client order details error:', error);
      navigate('/client/orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      WAITING: { label: 'Изчакване', className: 'bg-yellow-100 text-yellow-800' },
      IN_PROGRESS: { label: 'В процес', className: 'bg-blue-100 text-blue-800' },
      READY: { label: 'Готова за плащане', className: 'bg-green-100 text-green-800' },
      COMPLETED: { label: 'Платена', className: 'bg-gray-100 text-gray-800' },
      CANCELLED: { label: 'Отказана', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || {
      label: status,
      className: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { label: string; className: string }> = {
      LOW: { label: 'Нисък', className: 'bg-gray-100 text-gray-800' },
      NORMAL: { label: 'Нормален', className: 'bg-blue-100 text-blue-800' },
      HIGH: { label: 'Висок', className: 'bg-orange-100 text-orange-800' },
      URGENT: { label: 'Спешен', className: 'bg-red-100 text-red-800' },
    };

    const config = priorityConfig[priority] || {
      label: priority,
      className: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  const getItemTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      PART: 'Част',
      LABOR: 'Труд',
      CONSUMABLE: 'Консуматив',
    };
    return types[type] || type;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('bg-BG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('bg-BG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })} в ${date.toLocaleTimeString('bg-BG', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const formatMoney = (value: string | null) => {
    if (!value) return '—';
    return `${Number(value).toFixed(2)} €`;
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

  if (!data) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-textSecondary">Поръчката не е намерена</p>
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
            onClick={() => navigate('/client/orders')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Назад към поръчките"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-textPrimary">
                {data.displayOrderNumber || data.orderNumber}
              </h1>
              {getStatusBadge(data.status)}
              {getPriorityBadge(data.priority)}
            </div>
            <p className="text-textSecondary">
              {data.vehicle.brand} {data.vehicle.model} ({data.vehicle.licensePlate})
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <div className="bg-cardBg rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Информация за поръчката
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-textSecondary mb-1">Описание</p>
                  <p className="text-textPrimary">{data.description}</p>
                </div>

                {data.diagnosis && (
                  <div>
                    <p className="text-sm text-textSecondary mb-1">Диагноза</p>
                    <p className="text-textPrimary">{data.diagnosis}</p>
                  </div>
                )}

                {data.notes && (
                  <div>
                    <p className="text-sm text-textSecondary mb-1">Бележки</p>
                    <p className="text-textPrimary">{data.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-borderSubtle">
                  <Info
                    icon={<Calendar />}
                    label="Създадена на"
                    value={formatDateTime(data.createdAt)}
                  />

                  {data.startDate && (
                    <Info
                      icon={<Calendar />}
                      label="Започната на"
                      value={formatDate(data.startDate)}
                    />
                  )}

                  {data.endDate && (
                    <Info
                      icon={<Calendar />}
                      label="Очаквано завършване"
                      value={formatDate(data.endDate)}
                    />
                  )}

                  {data.completedDate && (
                    <Info
                      icon={<Calendar />}
                      label="Завършена на"
                      value={formatDate(data.completedDate)}
                    />
                  )}

                  {data.worker && (
                    <Info icon={<User />} label="Механик" value={data.worker} />
                  )}
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="bg-cardBg rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Car className="w-5 h-5" />
                Автомобил
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <Info
                  label="Марка / Модел"
                  value={`${data.vehicle.brand} ${data.vehicle.model}`}
                />
                <Info label="Рег. номер" value={data.vehicle.licensePlate} />
                {data.vehicle.year && (
                  <Info label="Година" value={data.vehicle.year} />
                )}
              </div>

              <button
                onClick={() => navigate(`/client/vehicles/${data.vehicle.id}`)}
                className="mt-4 text-sm text-primary hover:underline"
              >
                Виж детайли на автомобила →
              </button>
            </div>

            {/* Order Items */}
            {data.items.length > 0 && (
              <div className="bg-cardBg rounded-2xl shadow-card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Части и дейности
                </h2>

                <div className="space-y-3">
                  {data.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-mainBg rounded-lg border border-borderSubtle"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-textPrimary">
                              {item.name}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                              {getItemTypeLabel(item.type)}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-textMuted">
                            <span>Количество: {item.quantity}</span>
                            <span>Ед. цена: {formatMoney(item.unitPrice)}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-semibold text-lg text-textPrimary">
                            {formatMoney(item.totalPrice)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-6 pt-4 border-t-2 border-borderStrong">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-textPrimary">
                      Обща сума
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {formatMoney(data.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Status Info */}
            <div className="bg-cardBg rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-semibold mb-4">Статус</h2>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-textSecondary mb-2">Текущ статус</p>
                  {getStatusBadge(data.status)}
                </div>

                <div>
                  <p className="text-sm text-textSecondary mb-2">Приоритет</p>
                  {getPriorityBadge(data.priority)}
                </div>

                {data.status === 'READY' && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-900">
                          Ремонтът е готов
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          Можете да вземете автомобила си
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Invoice */}
            {data.invoice && (
              <div className="bg-cardBg rounded-2xl shadow-card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Фактура
                </h2>

                <div className="space-y-3">
                  <Info label="Номер" value={data.invoice.invoiceNumber} />
                  <Info
                    label="Издадена на"
                    value={formatDate(data.invoice.issueDate)}
                  />
                  <Info label="Обща сума" value={formatMoney(data.invoice.total)} />

                  <div className="pt-3 border-t border-borderSubtle">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-textSecondary">Статус</span>
                      {data.invoice.isPaid ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Платена
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Неплатена
                        </span>
                      )}
                    </div>

                    {data.invoice.isPaid && data.invoice.paidDate && (
                      <p className="text-xs text-textMuted">
                        Платена на: {formatDate(data.invoice.paidDate)}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => navigate('/client/invoices')}
                    className="w-full mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                  >
                    Виж фактурата
                  </button>
                </div>
              </div>
            )}

            {/* Price Summary (when no items) */}
            {data.items.length === 0 && data.totalPrice && (
              <div className="bg-cardBg rounded-2xl shadow-card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Цена
                </h2>

                <div className="text-center py-4">
                  <p className="text-sm text-textSecondary mb-2">Обща сума</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatMoney(data.totalPrice)}
                  </p>
                </div>
              </div>
            )}
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
  <div className="flex items-start gap-3">
    {icon && <div className="text-textMuted mt-0.5">{icon}</div>}
    <div className="min-w-0 flex-1">
      <p className="text-sm text-textSecondary">{label}</p>
      <div className="font-medium text-textPrimary break-words">{value}</div>
    </div>
  </div>
);

export default OrderDetails;
