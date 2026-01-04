import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  orderNumber: string;
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
      READY: 'Готова',
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
    <div className="bg-cardBg rounded-2xl shadow-card p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-textPrimary">
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
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              onClick={() => navigate(`/admin/orders/${order.id}`)}
              className="flex items-center justify-between p-4 bg-mainBg rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-textPrimary">
                  {order.vehicle.brand} {order.vehicle.model} (
                  {order.vehicle.licensePlate})
                </p>
                <p className="text-sm text-textSecondary">
                  {order.client.firstName} {order.client.lastName} •{' '}
                  {order.orderNumber}
                </p>
              </div>

              <div className="flex items-center gap-3">
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
