import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { bg } from 'date-fns/locale';
import api from '../../services/api';
import toast from 'react-hot-toast';
import CreateTaskModal from './CreateTaskModal';
import EditTaskModal from './EditTaskModal';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  startDate: string;
  vehicle: {
    brand: string;
    model: string;
  };
}

interface Schedule {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  worker: {
    firstName: string;
    lastName: string;
  } | null;
}

const OrdersCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [orders, setOrders] = useState<Order[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editScheduleId, setEditScheduleId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [ordersRes, schedulesRes] = await Promise.all([
        api.get('/orders'),
        api.get('/schedules'),
      ]);
      setOrders(ordersRes.data.orders || []);
      setSchedules(schedulesRes.data.schedules || []);
    } catch {
      toast.error('Грешка при зареждане на данни');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  const handleCloseModal = () => {
    setSelectedDate(null);
  };

  const handleCloseEditModal = () => {
    setEditScheduleId(null);
  };

  const handleSuccess = () => {
    fetchData();
  };

  const handleScheduleClick = (e: React.MouseEvent, scheduleId: string) => {
    e.stopPropagation();
    setEditScheduleId(scheduleId);
  };

  const renderHeader = () => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-textPrimary">
          {format(currentMonth, 'MMMM yyyy', { locale: bg })}
        </h2>

        <div className="flex gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Предишен месец"
            title="Предишен месец"
          >
            <ChevronLeft className="w-5 h-5 text-textSecondary" />
          </button>

          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Следващ месец"
            title="Следващ месец"
          >
            <ChevronRight className="w-5 h-5 text-textSecondary" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
    return (
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] sm:text-xs font-medium text-textMuted py-1.5 sm:py-2"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const getOrdersForDay = (day: Date) => {
    return orders.filter(
      (order) => order.startDate && isSameDay(new Date(order.startDate), day)
    );
  };

  const getSchedulesForDay = (day: Date) => {
    return schedules.filter(
      (schedule) => schedule.date && isSameDay(new Date(schedule.date), day)
    );
  };

  const getStatusColor = (status: string) => {
    const colors = {
      WAITING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      READY: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dayOrders = getOrdersForDay(cloneDay);
        const daySchedules = getSchedulesForDay(cloneDay);

        days.push(
          <div
            key={day.toString()}
            onClick={() => handleDayClick(cloneDay)}
            className={`min-h-24 p-2 border rounded-lg cursor-pointer ${
              !isSameMonth(day, monthStart)
                ? 'bg-gray-50'
                : 'bg-white hover:bg-primary/5 hover:border-primary'
            } transition-all`}
          >
            <span
              className={`text-sm font-medium ${
                !isSameMonth(day, monthStart)
                  ? 'text-textMuted'
                  : 'text-textPrimary'
              }`}
            >
              {format(day, 'd')}
            </span>

            <div className="mt-1 space-y-1 max-h-24 overflow-y-auto pr-1">
              {dayOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/orders/${order.id}`);
                  }}
                  className={`text-xs p-1 rounded cursor-pointer ${getStatusColor(
                    order.status
                  )}`}
                  title={`${order.vehicle.brand} ${order.vehicle.model}`}
                >
                  {order.vehicle.brand}
                </div>
              ))}
              {daySchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  onClick={(e) => handleScheduleClick(e, schedule.id)}
                  className="text-xs p-1 rounded cursor-pointer bg-purple-100 text-purple-800"
                  title={schedule.worker ? `${schedule.worker.firstName} ${schedule.worker.lastName}` : schedule.title}
                >
                  {schedule.worker
                    ? `${schedule.title} - ${schedule.worker.firstName} ${schedule.worker.lastName}`
                    : schedule.title}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }

      rows.push(
        <div className="grid grid-cols-7 gap-1" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="space-y-1">{rows}</div>;
  };

  if (isLoading) {
    return (
      <div className="bg-cardBg rounded-2xl shadow-card p-6">
        <h2 className="text-lg font-semibold text-textPrimary mb-4">
          Календар
        </h2>
        <div className="animate-pulse h-96 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <>
    <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
      {renderHeader()}
      <div className="overflow-x-auto">
        <div className="min-w-[560px] sm:min-w-0">
          {renderDays()}
          {renderCells()}
        </div>
      </div>
    </div>

      {selectedDate && (
        <CreateTaskModal
          selectedDate={selectedDate}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      )}

      {editScheduleId && (
        <EditTaskModal
          scheduleId={editScheduleId}
          onClose={handleCloseEditModal}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
};

export default OrdersCalendar;

