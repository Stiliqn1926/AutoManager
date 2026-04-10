import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  displayOrderNumber: string | null;
  status: string;
  vehicle: {
    brand: string;
    model: string;
    licensePlate: string;
  };
  client: {
    firstName: string;
    lastName: string;
  };
  endDate?: string | null;
  createdAt?: string;
}

interface RecentOrdersProps {
  orders: Order[];
}

const RecentOrders = ({ orders }: RecentOrdersProps) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      WAITING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      READY: 'bg-green-100 text-green-800',
    };

    const labels: Record<string, string> = {
      WAITING: 'Изчакване',
      IN_PROGRESS: 'В процес',
      READY: 'Готова за плащане',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[status] ?? 'bg-gray-100 text-gray-600'
        }`}
      >
        {labels[status] ?? status}
      </span>
    );
  };

  return (
    <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-textPrimary">
          Активни поръчки
        </h2>
        <button
          onClick={() => navigate('/admin/orders')}
          className="text-sm text-primary hover:text-primary-700 font-medium"
        >
          Виж всички →
        </button>
      </div>

      {orders.length === 0 ? (
        <p className="text-textSecondary text-center py-8">
          Няма активни поръчки
        </p>
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          {orders.map((order) => (
            <div
              key={order.id}
              onClick={() => navigate(`/admin/orders/${order.id}`)}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 bg-mainBg rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-textPrimary">
                  {order.vehicle.brand} {order.vehicle.model} (
                  {order.vehicle.licensePlate})
                </p>
                <p className="text-sm text-textSecondary">
                  {order.client.firstName} {order.client.lastName} •{' '}
                  {order.displayOrderNumber || order.orderNumber}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {order.endDate && (
                  <div className="flex items-center gap-1 text-xs text-textMuted">
                    <Clock className="w-4 h-4" />
                    {new Date(order.endDate).toLocaleDateString('bg-BG')}
                  </div>
                )}
                {getStatusBadge(order.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentOrders;

