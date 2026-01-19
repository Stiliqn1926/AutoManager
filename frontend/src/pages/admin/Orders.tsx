import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit,
  Eye,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalPrice: number | string | null;
  isPaid: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    firstName: string;
    lastName: string;
  };
  vehicle: {
    brand: string;
    model: string;
    licensePlate: string;
  };
  worker: {
    firstName: string;
    lastName: string;
  } | null;
}

type SortField =
  | 'orderNumber'
  | 'client'
  | 'status'
  | 'totalPrice'
  | 'startDate'
  | 'updatedAt';

type SortOrder = 'asc' | 'desc';

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('orderNumber');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');

  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data.orders || []);
    } catch {
      toast.error('Грешка при зареждане на поръчки');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredOrders = (() => {
    const filtered = orders.filter((order) => {
      const matchesSearch = `${order.orderNumber} ${order.client.firstName} ${order.client.lastName} ${order.vehicle.licensePlate}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === 'all' || order.status === filterStatus;

      const matchesPayment =
        filterPayment === 'all' ||
        (filterPayment === 'paid' && order.isPaid) ||
        (filterPayment === 'unpaid' && !order.isPaid);

      return matchesSearch && matchesStatus && matchesPayment;
    });

    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'orderNumber':
          aValue = a.orderNumber;
          bValue = b.orderNumber;
          break;
        case 'client':
          aValue = `${a.client.firstName} ${a.client.lastName}`;
          bValue = `${b.client.firstName} ${b.client.lastName}`;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'totalPrice':
          aValue = a.totalPrice ?? 0;
          bValue = b.totalPrice ?? 0;
          break;
        case 'startDate':
          aValue = a.startDate ? new Date(a.startDate).getTime() : 0;
          bValue = b.startDate ? new Date(b.startDate).getTime() : 0;
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc'
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue);
    });

    return filtered;
  })();

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

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
      READY: 'Готова',
      COMPLETED: 'Завършена',
      CANCELLED: 'Отказана',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-textPrimary">Поръчки</h1>
          <Button onClick={() => navigate('/admin/orders/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Нова поръчка
          </Button>
        </div>

        <div className="bg-cardBg rounded-2xl shadow-card p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
              <input
                type="text"
                aria-label="Търсене на поръчки"
                placeholder="Търси по номер, клиент или рег. номер"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <select
              aria-label="Филтър по статус"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Всички статуси</option>
              <option value="WAITING">Изчакване</option>
              <option value="IN_PROGRESS">В процес</option>
              <option value="READY">Готова</option>
              <option value="COMPLETED">Завършена</option>
              <option value="CANCELLED">Отказана</option>
            </select>

            <select
              aria-label="Филтър по плащане"
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Всички плащания</option>
              <option value="paid">Платени</option>
              <option value="unpaid">Неплатени</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-borderSubtle">
                  {[
                    { key: 'orderNumber', label: '№ Поръчка' },
                    { key: 'client', label: 'Клиент' },
                    { key: 'status', label: 'Статус' },
                    { key: 'totalPrice', label: 'Сума' },
                    { key: 'startDate', label: 'Начална дата' },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key as SortField)}
                      className="text-left py-3 px-4 text-sm font-semibold cursor-pointer hover:bg-mainBg"
                    >
                      <div className="flex items-center gap-2">
                        {label}
                        <SortIcon field={key as SortField} />
                      </div>
                    </th>
                  ))}
                  <th className="text-right py-3 px-4 text-sm font-semibold">
                    Действия
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-textSecondary">
                      Няма намерени поръчки
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b hover:bg-mainBg cursor-pointer"
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                    >
                      <td className="px-4 py-4 font-medium">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-4">
                        {order.client.firstName} {order.client.lastName}
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-4 py-4 font-medium">
                        {Number(order.totalPrice || 0).toFixed(2)} лв
                      </td>
                      <td className="px-4 py-4">
                        {order.startDate
                          ? new Date(order.startDate).toLocaleDateString('bg-BG')
                          : '-'}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div
                          className="flex justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            aria-label="Преглед на поръчка"
                            title="Преглед"
                            className="p-2 rounded-lg hover:bg-gray-100"
                            onClick={() =>
                              navigate(`/admin/orders/${order.id}`)
                            }
                          >
                            <Eye className="w-4 h-4 text-primary" />
                          </button>
                          <button
                            aria-label="Редактиране на поръчка"
                            title="Редактирай"
                            className="p-2 rounded-lg hover:bg-gray-100"
                            onClick={() =>
                              navigate(`/admin/orders/${order.id}/edit`)
                            }
                          >
                            <Edit className="w-4 h-4 text-primary" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Orders;
