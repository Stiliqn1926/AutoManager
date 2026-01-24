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
  X,
  Download,
  CreditCard,
  Package,
  ChevronRight,
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
  displayOrderNumber?: string | null;
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
  const [selectedOrder, setSelectedOrder] = useState<ServiceHistoryOrder | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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
      READY: 'Готова за плащане',
      COMPLETED: 'Платена',
      CANCELLED: 'Отказана',
    };

    return (
      <span
        className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
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
    return `${num.toFixed(2)} €`;
  };

  const sumItems = (items: OrderItem[]) =>
    items.reduce((acc, it) => acc + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0), 0);

  const handleDownloadInvoice = async (invoiceNumber: string) => {
    setIsDownloading(true);
    try {
      const response = await api.get(`/client/invoices/${invoiceNumber}/pdf`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Фактурата е изтеглена');
    } catch (error) {
      toast.error('Грешка при изтегляне на фактура');
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'PART':
        return 'Част';
      case 'LABOR':
        return 'Труд';
      case 'CONSUMABLE':
        return 'Консуматив';
      default:
        return type;
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
                      <button
                        type="button"
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="w-full text-left p-4 bg-mainBg rounded-lg border border-borderSubtle hover:border-primary hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-textPrimary">{order.displayOrderNumber || order.orderNumber}</span>
                              {getStatusBadge(order.status)}
                            </div>

                            <p className="text-sm text-textSecondary line-clamp-1">{order.description}</p>

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
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right shrink-0">
                              <div className="font-semibold text-textPrimary">{displayedTotal}</div>
                              {order.invoice ? (
                                <div className="mt-1 inline-flex items-center gap-1 text-xs text-green-600">
                                  <FileText className="w-3 h-3" />
                                  Има фактура
                                </div>
                              ) : null}
                            </div>
                            <ChevronRight className="w-5 h-5 text-textMuted" />
                          </div>
                        </div>
                      </button>
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

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-cardBg rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-borderSubtle">
              <div>
                <h2 className="text-xl font-bold text-textPrimary">
                  Поръчка {selectedOrder.displayOrderNumber || selectedOrder.orderNumber}
                </h2>
                <p className="text-sm text-textSecondary mt-1">{selectedOrder.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Затвори"
                title="Затвори"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-textSecondary" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
              {/* Status & Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-textSecondary mb-1">Статус</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div>
                  <p className="text-sm text-textSecondary mb-1">Създадена</p>
                  <p className="font-medium text-textPrimary">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                {selectedOrder.worker && (
                  <div>
                    <p className="text-sm text-textSecondary mb-1">Механик</p>
                    <p className="font-medium text-textPrimary">{selectedOrder.worker}</p>
                  </div>
                )}
                {selectedOrder.endDate && (
                  <div>
                    <p className="text-sm text-textSecondary mb-1">Очаквана дата</p>
                    <p className="font-medium text-textPrimary">{formatDate(selectedOrder.endDate)}</p>
                  </div>
                )}
                {selectedOrder.completedDate && (
                  <div>
                    <p className="text-sm text-textSecondary mb-1">Завършена</p>
                    <p className="font-medium text-textPrimary">{formatDate(selectedOrder.completedDate)}</p>
                  </div>
                )}
              </div>

              {/* Order Items */}
              {selectedOrder.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-textPrimary mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Дейности и части
                  </h3>
                  <div className="bg-mainBg rounded-lg border border-borderSubtle overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-borderSubtle bg-gray-50">
                          <th className="text-left py-2 px-3 text-sm font-medium text-textSecondary">Описание</th>
                          <th className="text-center py-2 px-3 text-sm font-medium text-textSecondary">Тип</th>
                          <th className="text-right py-2 px-3 text-sm font-medium text-textSecondary">К-во</th>
                          <th className="text-right py-2 px-3 text-sm font-medium text-textSecondary">Ед. цена</th>
                          <th className="text-right py-2 px-3 text-sm font-medium text-textSecondary">Сума</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item) => (
                          <tr key={item.id} className="border-b border-borderSubtle last:border-b-0">
                            <td className="py-2 px-3 text-sm text-textPrimary">{item.description}</td>
                            <td className="py-2 px-3 text-sm text-textSecondary text-center">{getItemTypeLabel(item.type)}</td>
                            <td className="py-2 px-3 text-sm text-textSecondary text-right">{item.quantity}</td>
                            <td className="py-2 px-3 text-sm text-textSecondary text-right">{formatMoney(item.unitPrice)}</td>
                            <td className="py-2 px-3 text-sm font-medium text-textPrimary text-right">
                              {formatMoney((Number(item.unitPrice) || 0) * (Number(item.quantity) || 0))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50">
                          <td colSpan={4} className="py-3 px-3 text-right font-semibold text-textPrimary">
                            Обща сума:
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-primary text-lg">
                            {formatMoney(selectedOrder.totalPrice ?? sumItems(selectedOrder.items))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Invoice Section */}
              {selectedOrder.invoice && (
                <div>
                  <h3 className="text-lg font-semibold text-textPrimary mb-3 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Фактура
                  </h3>
                  <div className="bg-mainBg rounded-lg border border-borderSubtle p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-textSecondary">Номер на фактура</p>
                        <p className="font-semibold text-textPrimary">{selectedOrder.invoice.invoiceNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-textSecondary">Статус</p>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            selectedOrder.invoice.isPaid
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {selectedOrder.invoice.isPaid ? 'Платена' : 'Неплатена'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-textSecondary">Дата на издаване</p>
                        <p className="font-medium text-textPrimary">{formatDate(selectedOrder.invoice.issueDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-textSecondary">Сума</p>
                        <p className="font-semibold text-primary">{formatMoney(selectedOrder.invoice.total)}</p>
                      </div>
                      {selectedOrder.invoice.paidDate && (
                        <div>
                          <p className="text-sm text-textSecondary">Платена на</p>
                          <p className="font-medium text-textPrimary">{formatDate(selectedOrder.invoice.paidDate)}</p>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadInvoice(selectedOrder.invoice!.invoiceNumber)}
                      disabled={isDownloading}
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      {isDownloading ? 'Изтегляне...' : 'Изтегли фактура (PDF)'}
                    </button>
                  </div>
                </div>
              )}

              {/* No invoice message */}
              {!selectedOrder.invoice && (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <FileText className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-textSecondary">Все още няма издадена фактура за тази поръчка</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-borderSubtle bg-gray-50">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-full px-4 py-2 bg-gray-200 text-textPrimary rounded-lg hover:bg-gray-300 transition-colors"
              >
                Затвори
              </button>
            </div>
          </div>
        </div>
      )}
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
