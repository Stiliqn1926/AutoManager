import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string | null;
  isActive: boolean;
}

interface ActiveTasksData {
  hasActiveTasks: boolean;
  activeOrdersCount: number;
  activeSchedulesCount: number;
  activeOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    description: string | null;
  }>;
  activeSchedules: Array<{
    id: string;
    startTime: string;
    endTime: string;
    description: string | null;
  }>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  workerId: string;
  workerName: string;
  tasksData: ActiveTasksData;
}

const ReassignWorkerModal = ({
  isOpen,
  onClose,
  onSuccess,
  workerId,
  workerName,
  tasksData,
}: Props) => {
  const [availableWorkers, setAvailableWorkers] = useState<Worker[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableWorkers();
    }
  }, [isOpen]);

  const fetchAvailableWorkers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/workers');
      // Филтрирай само ACTIVE и различни от текущия механик
      const workers = response.data.workers.filter(
        (w: Worker & { membershipStatus: string }) =>
          w.membershipStatus === 'ACTIVE' &&
          w.isActive &&
          w.id !== workerId
      );
      setAvailableWorkers(workers);
    } catch {
      toast.error('Грешка при зареждане на механици');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!selectedWorkerId) {
      toast.error('Моля изберете механик');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put(`/workers/${workerId}/reassign`, {
        newWorkerId: selectedWorkerId,
      });
      toast.success('Задачите са преназначени успешно');
      onSuccess();
      onClose();
    } catch {
      toast.error('Грешка при преназначаване на задачи');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-borderSubtle">
          <h2 className="text-2xl font-bold text-textPrimary">
            Преназначаване на задачи
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning */}
          <div className="bg-gray-50 border border-borderSubtle rounded-lg p-4">
            <p className="text-sm text-textSecondary">
              <strong className="text-textPrimary">{workerName}</strong> има активни задачи, които трябва да
              бъдат преназначени преди изтриване.
            </p>
          </div>

          {/* Tasks Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-borderSubtle rounded-lg p-4">
              <div className="text-sm text-textSecondary mb-1">Активни поръчки</div>
              <div className="text-3xl font-bold text-textPrimary">
                {tasksData.activeOrdersCount}
              </div>
            </div>
            <div className="bg-white border border-borderSubtle rounded-lg p-4">
              <div className="text-sm text-textSecondary mb-1">Активни задачи</div>
              <div className="text-3xl font-bold text-textPrimary">
                {tasksData.activeSchedulesCount}
              </div>
            </div>
          </div>

          {/* Select New Worker */}
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">
              Изберете механик за преназначаване
            </label>
            {isLoading ? (
              <div className="text-center py-4 text-textSecondary">
                Зареждане...
              </div>
            ) : availableWorkers.length === 0 ? (
              <div className="bg-gray-50 border border-borderSubtle rounded-lg p-4">
                <p className="text-sm text-textSecondary">
                  Няма налични механици за преназначаване. Моля добавете активен
                  механик преди да изтриете този.
                </p>
              </div>
            ) : (
              <select
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                className="w-full px-4 py-2 border border-borderSubtle rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">-- Изберете механик --</option>
                {availableWorkers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.firstName} {worker.lastName}
                    {worker.specialization && ` (${worker.specialization})`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Preview */}
          {selectedWorkerId && (
            <div className="bg-primary-50 border border-primary rounded-lg p-4">
              <div className="flex items-center gap-3 text-sm text-textPrimary">
                <span className="font-semibold">{workerName}</span>
                <ArrowRight className="w-4 h-4" />
                <span className="font-semibold">
                  {availableWorkers.find((w) => w.id === selectedWorkerId)
                    ?.firstName}{' '}
                  {availableWorkers.find((w) => w.id === selectedWorkerId)
                    ?.lastName}
                </span>
              </div>
              <p className="text-xs text-textSecondary mt-2">
                Всички активни поръчки и задачи ще бъдат прехвърлени към новия
                механик
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-borderSubtle">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-textPrimary rounded-lg hover:bg-gray-300 transition-colors"
          >
            Отказ
          </button>
          <button
            onClick={handleReassign}
            disabled={!selectedWorkerId || isSubmitting || availableWorkers.length === 0}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Преназначаване...' : 'Прехвърли и изтрий'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReassignWorkerModal;
