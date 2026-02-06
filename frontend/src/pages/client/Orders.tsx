import { useState, useEffect, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { useServiceCompany } from '../../hooks/useServiceCompany';

import {

  ClipboardList,

  Search,

  Calendar,

  DollarSign,

  User,

  Car,

  ChevronRight,

} from 'lucide-react';

import MainLayout from '../../components/layout/MainLayout';

import api from '../../services/api';

import toast from 'react-hot-toast';



interface Order {

  id: string;

  orderNumber: string;

  displayOrderNumber?: string | null;

  description: string;

  status: string;

  totalPrice: string | null;

  endDate: string | null;

  createdAt: string;

  vehicle: {

    brand: string;

    model: string;

    licensePlate: string;

  };

  worker: string | null;

}



const Orders = () => {

  const navigate = useNavigate();

  const { selectedServiceCompany } = useServiceCompany();



  const [orders, setOrders] = useState<Order[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState('ALL');



  const fetchOrders = useCallback(async () => {

    if (!selectedServiceCompany) {

      setOrders([]);

      setIsLoading(false);

      return;

    }



    setIsLoading(true);

    try {

      const response = await api.get('/client/orders', {

        params: { serviceCompanyId: selectedServiceCompany.id },

      });



      setOrders(response.data.orders || []);

    } catch (error) {

      toast.error('Грешка при зареждане на поръчки');

      console.error('Client orders error:', error);

    } finally {

      setIsLoading(false);

    }

  }, [selectedServiceCompany]);



  useEffect(() => {

    fetchOrders();

  }, [fetchOrders]);



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

        className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${config.className}`}

      >

        {config.label}

      </span>

    );

  };



  const formatDate = (dateString: string) => {

    return new Date(dateString).toLocaleDateString('bg-BG', {

      day: 'numeric',

      month: 'short',

      year: 'numeric',

    });

  };



  const formatMoney = (value: string | null) => {

    if (!value) return '—';

    return `${Number(value).toFixed(2)} €`;

  };



  const filteredOrders = orders.filter((order) => {

    if (statusFilter !== 'ALL' && order.status !== statusFilter) {

      return false;

    }



    const searchLower = searchTerm.toLowerCase().trim();

    const tokens = searchLower.split(/\s+/).filter(Boolean);

    if (tokens.length === 0) return true;



    const fields = [

      order.displayOrderNumber || order.orderNumber,

      order.description,

      order.vehicle.brand,

      order.vehicle.model,

      order.vehicle.licensePlate,

    ].map((value) => value.toLowerCase());



    return tokens.every((token) => fields.some((field) => field.startsWith(token)));

  });



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

          <ClipboardList className="w-16 h-16 mx-auto text-gray-400 mb-4" />

          <h2 className="text-xl font-semibold text-textPrimary mb-2">

            Няма избран сервиз

          </h2>

          <p className="text-textSecondary">
            Избери сервиз от „Моите сервизи“, за да видиш поръчките си.
          </p>

        </div>

      </MainLayout>

    );

  }



  return (

    <MainLayout>

      <div className="space-y-4 sm:space-y-6">

                        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">Поръчки</h1>
            <p className="text-textSecondary mt-1">
              Всички активни и завършени поръчки в {selectedServiceCompany.name}
            </p>
          </div>
        </div>

        {/* Stats */}

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

  <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">

    <div className="flex items-center justify-between">

      <div>

        <p className="text-sm text-textSecondary">Всички поръчки</p>

        <p className="text-2xl sm:text-3xl font-bold text-textPrimary mt-1">{orders.length}</p>

      </div>

      <div className="p-3 bg-gray-100 rounded-lg border border-borderSubtle">

        <ClipboardList className="w-6 h-6 text-primary" />

      </div>

    </div>

  </div>



  <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">

    <div className="flex items-center justify-between">

      <div>

        <p className="text-sm text-textSecondary">В процес</p>

        <p className="text-2xl sm:text-3xl font-bold text-textPrimary mt-1">

          {orders.filter((o) => o.status === 'IN_PROGRESS').length}

        </p>

      </div>

      <div className="p-3 bg-gray-100 rounded-lg border border-borderSubtle">

        <Car className="w-6 h-6 text-primary" />

      </div>

    </div>

  </div>



  <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">

    <div className="flex items-center justify-between">

      <div>

        <p className="text-sm text-textSecondary">Завършени</p>

        <p className="text-2xl sm:text-3xl font-bold text-textPrimary mt-1">

          {orders.filter((o) => o.status === 'COMPLETED').length}

        </p>

      </div>

      <div className="p-3 bg-gray-100 rounded-lg border border-borderSubtle">

        <ClipboardList className="w-6 h-6 text-primary" />

      </div>

    </div>

  </div>

</div>





                        {/* Search & List */}
        <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
          {/* Search */}
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
              <input
                type="text"
                placeholder="Търси по номер, описание или автомобил..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="w-full md:w-56">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Филтър по статус"
              >
                <option value="ALL">Всички статуси</option>
                <option value="WAITING">Изчакване</option>
                <option value="IN_PROGRESS">В процес</option>
                <option value="READY">Готова за плащане</option>
                <option value="COMPLETED">Платена</option>
                <option value="CANCELLED">Отказана</option>
              </select>
            </div>
          </div>

          {/* Orders List */}

          {filteredOrders.length === 0 ? (

            <div className="text-center py-12">

              <ClipboardList className="w-16 h-16 mx-auto text-gray-400 mb-4" />

              <h3 className="text-lg font-semibold text-textPrimary mb-2">
                {searchTerm || statusFilter !== 'ALL' ? 'Няма резултати' : 'Няма поръчки'}
              </h3>

              <p className="text-textSecondary">

                {searchTerm

                  ? 'Опитай друга заявка за търсене'

                  : 'Всички твои поръчки са завършени'}

              </p>

            </div>

          ) : (

            <div className="space-y-3">

              {filteredOrders.map((order) => (

                <div

                  key={order.id}

                  onClick={() => navigate(`/client/orders/${order.id}`)}

                  className="p-3 sm:p-4 border border-borderSubtle rounded-lg hover:bg-mainBg cursor-pointer transition-colors group"

                >

                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">

                    {/* Left - Info */}

                    <div className="flex-1 min-w-0">

                      <div className="flex flex-wrap items-center gap-2 mb-2">

                        <span className="font-semibold text-textPrimary">

                          {order.displayOrderNumber || order.orderNumber}

                        </span>

                        {getStatusBadge(order.status)}

                      </div>



                      <div className="flex flex-wrap items-center gap-2 mb-2">

                        <Car className="w-4 h-4 text-textMuted flex-shrink-0" />

                        <span className="text-sm text-textPrimary">

                          {order.vehicle.brand} {order.vehicle.model}

                        </span>

                        <span className="text-sm text-textMuted">

                          ({order.vehicle.licensePlate})

                        </span>

                      </div>



                      <p className="text-sm text-textSecondary line-clamp-2">

                        {order.description}

                      </p>



                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 text-sm text-textMuted">

                        <div className="flex items-center gap-1">

                          <Calendar className="w-4 h-4" />

                          {formatDate(order.createdAt)}

                        </div>



                        {order.worker && (

                          <div className="flex items-center gap-1">

                            <User className="w-4 h-4" />

                            {order.worker}

                          </div>

                        )}



                        {order.endDate && (

                          <div className="flex items-center gap-1 text-primary">

                            <Calendar className="w-4 h-4" />

                            Очаквана: {formatDate(order.endDate)}

                          </div>

                        )}

                      </div>

                    </div>



                    {/* Right - Price & Arrow */}

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">

                      {order.totalPrice && (

                        <div className="text-left sm:text-right">

                          <div className="flex items-center gap-1 text-textMuted text-xs mb-1">

                            <DollarSign className="w-4 h-4" />

                            Обща сума

                          </div>

                          <div className="font-semibold text-lg text-textPrimary">

                            {formatMoney(order.totalPrice)}

                          </div>

                        </div>

                      )}



                      <ChevronRight className="w-5 h-5 text-textMuted group-hover:text-primary transition-colors" />

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </MainLayout>

  );

};



export default Orders;

