import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServiceCompany } from '../../hooks/useServiceCompany';
import { Bell, Check, Mail, Wrench, DollarSign, Info } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const getNotificationType = (title: string) => {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('статус') || lowerTitle.includes('ремонт') || lowerTitle.includes('поръчка')) {
    return { icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-100' };
  }
  if (lowerTitle.includes('фактура') || lowerTitle.includes('плащане') || lowerTitle.includes('сума')) {
    return { icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' };
  }
  return { icon: Info, color: 'text-gray-600', bg: 'bg-gray-100' };
};

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  orderId: string | null;
  order?: {
    orderNumber: string;
    displayOrderNumber?: string | null;
  } | null;
}

const Notifications = () => {
  const navigate = useNavigate();
  const { selectedServiceCompany } = useServiceCompany();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = useCallback(async () => {
    if (!selectedServiceCompany) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get('/client/notifications', {
        params: { serviceCompanyId: selectedServiceCompany.id },
      });
      setNotifications(response.data.notifications || []);
    } catch (error) {
      toast.error('Грешка при зареждане на известия');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedServiceCompany]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/client/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      toast.error('Грешка при маркиране');
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
      await Promise.all(unreadIds.map((id) => api.put(`/client/notifications/${id}/read`)));
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('Всички известия са маркирани като прочетени');
    } catch (error) {
      toast.error('Грешка');
      console.error(error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.orderId) {
      navigate(`/client/orders/${notification.orderId}`);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Сега';
    if (minutes < 60) return `Преди ${minutes} мин`;
    if (hours < 24) return `Преди ${hours} ч`;
    if (days < 7) return `Преди ${days} дни`;

    return date.toLocaleDateString('bg-BG', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!selectedServiceCompany) {
    return (
      <MainLayout>
        <div className="bg-cardBg rounded-2xl shadow-card p-6 sm:p-12 text-center">
          <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-textPrimary mb-2">Няма избран сервиз</h2>
          <p className="text-textSecondary">Избери сервиз, за да видиш известията си.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">Известия</h1>
            <p className="text-textSecondary mt-1">
              {unreadCount > 0 ? `${unreadCount} непрочетени` : ''}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="w-full sm:w-auto flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              Маркирай всички като прочетени
            </button>
          )}
        </div>

       {/* Stats */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
  <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-textSecondary">Всичко</p>
        <p className="text-2xl sm:text-3xl font-bold text-textPrimary mt-1">
          {notifications.length}
        </p>
      </div>
      <div className="p-3 bg-gray-100 rounded-lg border border-borderSubtle">
        <Mail className="w-6 h-6 text-primary" />
      </div>
    </div>
  </div>

  <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-textSecondary">Непрочетени</p>
        <p className="text-2xl sm:text-3xl font-bold text-textPrimary mt-1">{unreadCount}</p>
      </div>
      <div className="p-3 bg-gray-100 rounded-lg border border-borderSubtle">
        <Bell className="w-6 h-6 text-primary" />
      </div>
    </div>
  </div>
</div>


        {/* Filters */}
        <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
          <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
            {[
              { key: 'all', label: 'Всички' },
              { key: 'unread', label: 'Непрочетени' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as typeof filter)}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-textSecondary hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-textPrimary mb-2">Няма известия</h3>
              <p className="text-textSecondary">
                {filter === 'unread' ? 'Всички известия са прочетени' : 'Все още няма известия'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 sm:p-4 border-l-4 rounded-r-lg transition-all cursor-pointer ${
                    notification.isRead
                      ? 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                      : 'border-primary bg-primary/5 hover:bg-primary/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {(() => {
                      const notifType = getNotificationType(notification.title);
                      const Icon = notifType.icon;
                      return (
                        <div className={`p-2 rounded-lg ${notifType.bg} flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${notifType.color}`} />
                        </div>
                      );
                    })()}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-textPrimary">{notification.title}</h3>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>

                      <p className="text-sm text-textSecondary mb-2">{notification.message}</p>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-textMuted">
                        <span>{formatDateTime(notification.createdAt)}</span>
                        {notification.order && (
                          <span className="font-mono text-primary">
                            {notification.order.displayOrderNumber || notification.order.orderNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!notification.isRead && (
                    <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="p-2 hover:bg-primary/20 rounded-lg transition-colors"
                        title="Маркирай като прочетено"
                      >
                        <Check className="w-4 h-4 text-primary" />
                      </button>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Notifications;
