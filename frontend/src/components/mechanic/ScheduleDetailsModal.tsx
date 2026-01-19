import { X, Clock, Calendar, User, Car, FileText, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ScheduleTask {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  title?: string;
  description?: string;
  order?: {
    id: string;
    orderNumber: string;
    description?: string;
    client: {
      firstName: string;
      lastName: string;
      phone?: string;
    };
    vehicle: {
      brand: string;
      model: string;
      licensePlate: string;
    };
  };
}

interface ScheduleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: ScheduleTask | null;
}

const ScheduleDetailsModal = ({ isOpen, onClose, schedule }: ScheduleDetailsModalProps) => {
  const navigate = useNavigate();

  if (!isOpen || !schedule) return null;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('bg-BG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      SCHEDULED: { label: 'Планирана', className: 'bg-blue-100 text-blue-800' },
      IN_PROGRESS: { label: 'В процес', className: 'bg-yellow-100 text-yellow-800' },
      COMPLETED: { label: 'Завършена', className: 'bg-green-100 text-green-800' },
      CANCELLED: { label: 'Отменена', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3" />}
        {config.label}
      </span>
    );
  };

  const handleViewFullDetails = () => {
    navigate(`/mechanic/schedule/${schedule.id}`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-borderSubtle px-6 py-4 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold text-textPrimary">Детайли за задачата</h3>
              <p className="text-sm text-textSecondary mt-1">{formatDate(schedule.startTime)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-textSecondary" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Време */}
          <div className="flex items-start gap-3">
            <div className="mt-1 p-2 bg-primary/10 rounded-lg">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-textSecondary">Време</label>
              <p className="text-base font-semibold text-textPrimary mt-1">
                {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
              </p>
            </div>
          </div>

          {/* Статус */}
          <div className="flex items-start gap-3">
            <div className="mt-1 p-2 bg-primary/10 rounded-lg">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-textSecondary">Статус</label>
              <div className="mt-2">
                {getStatusBadge(schedule.status)}
              </div>
            </div>
          </div>

          {/* Поръчка информация */}
          {schedule.order && (
            <>
              <div className="border-t border-borderSubtle pt-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="mt-1 p-2 bg-primary/10 rounded-lg">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium text-textSecondary">Поръчка</label>
                    <p className="text-base font-semibold text-textPrimary mt-1">
                      #{schedule.order.orderNumber}
                    </p>
                  </div>
                </div>
              </div>

              {/* Клиент */}
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-primary/10 rounded-lg">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-textSecondary">Клиент</label>
                  <p className="text-base font-semibold text-textPrimary mt-1">
                    {schedule.order.client.firstName} {schedule.order.client.lastName}
                  </p>
                  {schedule.order.client.phone && (
                    <p className="text-sm text-textSecondary mt-1">
                      {schedule.order.client.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Автомобил */}
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-primary/10 rounded-lg">
                  <Car className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-textSecondary">Автомобил</label>
                  <p className="text-base font-semibold text-textPrimary mt-1">
                    {schedule.order.vehicle.brand} {schedule.order.vehicle.model}
                  </p>
                  <p className="text-sm text-textSecondary mt-1">
                    {schedule.order.vehicle.licensePlate}
                  </p>
                </div>
              </div>

              {/* Описание на поръчката */}
              {schedule.order.description && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-sm font-medium text-textSecondary">Описание</label>
                  <p className="text-sm text-textPrimary mt-2 whitespace-pre-wrap">
                    {schedule.order.description}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Описание на задачата (ако няма поръчка) */}
          {!schedule.order && schedule.description && (
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-sm font-medium text-textSecondary">Описание</label>
              <p className="text-sm text-textPrimary mt-2 whitespace-pre-wrap">
                {schedule.description}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t border-borderSubtle px-6 py-4 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              onClick={handleViewFullDetails}
              className="flex-1 bg-primary text-white px-4 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Отвори пълния преглед
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-borderSubtle rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Затвори
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleDetailsModal;
