import { useCallback, useState, useEffect } from 'react';
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

  const fetchAvailableWorkers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/workers');

      const workers = response.data.workers.filter(
        (w: Worker & { membershipStatus: string }) =>
          w.membershipStatus === 'ACTIVE' &&
          w.isActive &&
          w.id !== workerId
      );
      setAvailableWorkers(workers);
    } catch {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° Ð¼ÐµÑ…Ð°Ð½Ð¸Ñ†Ð¸');
    } finally {
      setIsLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableWorkers();
    }
  }, [fetchAvailableWorkers, isOpen]);

  const handleReassign = async () => {
    if (!selectedWorkerId) {
      toast.error('ÐœÐ¾Ð»Ñ Ð¸Ð·Ð±ÐµÑ€ÐµÑ‚Ðµ Ð¼ÐµÑ…Ð°Ð½Ð¸Ðº');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put(`/workers/${workerId}/reassign`, {
        newWorkerId: selectedWorkerId,
      });
      toast.success('Ð—Ð°Ð´Ð°Ñ‡Ð¸Ñ‚Ðµ ÑÐ° Ð¿Ñ€ÐµÐ½Ð°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾');
      onSuccess();
      onClose();
    } catch {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¿Ñ€ÐµÐ½Ð°Ð·Ð½Ð°Ñ‡Ð°Ð²Ð°Ð½Ðµ Ð½Ð° Ð·Ð°Ð´Ð°Ñ‡Ð¸');
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
            ÐŸÑ€ÐµÐ½Ð°Ð·Ð½Ð°Ñ‡Ð°Ð²Ð°Ð½Ðµ Ð½Ð° Ð·Ð°Ð´Ð°Ñ‡Ð¸
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Ð—Ð°Ñ‚Ð²Ð¾Ñ€Ð¸"
            title="Ð—Ð°Ñ‚Ð²Ð¾Ñ€Ð¸"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning */}
          <div className="bg-gray-50 border border-borderSubtle rounded-lg p-4">
            <p className="text-sm text-textSecondary">
              <strong className="text-textPrimary">{workerName}</strong> Ð¸Ð¼Ð° Ð°ÐºÑ‚Ð¸Ð²Ð½Ð¸ Ð·Ð°Ð´Ð°Ñ‡Ð¸, ÐºÐ¾Ð¸Ñ‚Ð¾ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð°
              Ð±ÑŠÐ´Ð°Ñ‚ Ð¿Ñ€ÐµÐ½Ð°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸ Ð¿Ñ€ÐµÐ´Ð¸ Ð¸Ð·Ñ‚Ñ€Ð¸Ð²Ð°Ð½Ðµ.
            </p>
          </div>

          {/* Tasks Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-borderSubtle rounded-lg p-4">
              <div className="text-sm text-textSecondary mb-1">ÐÐºÑ‚Ð¸Ð²Ð½Ð¸ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ¸</div>
              <div className="text-3xl font-bold text-textPrimary">
                {tasksData.activeOrdersCount}
              </div>
            </div>
            <div className="bg-white border border-borderSubtle rounded-lg p-4">
              <div className="text-sm text-textSecondary mb-1">ÐÐºÑ‚Ð¸Ð²Ð½Ð¸ Ð·Ð°Ð´Ð°Ñ‡Ð¸</div>
              <div className="text-3xl font-bold text-textPrimary">
                {tasksData.activeSchedulesCount}
              </div>
            </div>
          </div>

          {/* Select New Worker */}
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">
              Ð˜Ð·Ð±ÐµÑ€ÐµÑ‚Ðµ Ð¼ÐµÑ…Ð°Ð½Ð¸Ðº Ð·Ð° Ð¿Ñ€ÐµÐ½Ð°Ð·Ð½Ð°Ñ‡Ð°Ð²Ð°Ð½Ðµ
            </label>
            {isLoading ? (
              <div className="text-center py-4 text-textSecondary">
                Ð—Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ...
              </div>
            ) : availableWorkers.length === 0 ? (
              <div className="bg-gray-50 border border-borderSubtle rounded-lg p-4">
                <p className="text-sm text-textSecondary">
                  ÐÑÐ¼Ð° Ð½Ð°Ð»Ð¸Ñ‡Ð½Ð¸ Ð¼ÐµÑ…Ð°Ð½Ð¸Ñ†Ð¸ Ð·Ð° Ð¿Ñ€ÐµÐ½Ð°Ð·Ð½Ð°Ñ‡Ð°Ð²Ð°Ð½Ðµ. ÐœÐ¾Ð»Ñ Ð´Ð¾Ð±Ð°Ð²ÐµÑ‚Ðµ Ð°ÐºÑ‚Ð¸Ð²ÐµÐ½
                  Ð¼ÐµÑ…Ð°Ð½Ð¸Ðº Ð¿Ñ€ÐµÐ´Ð¸ Ð´Ð° Ð¸Ð·Ñ‚Ñ€Ð¸ÐµÑ‚Ðµ Ñ‚Ð¾Ð·Ð¸.
                </p>
              </div>
            ) : (
              <select
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                aria-label="Ð˜Ð·Ð±ÐµÑ€ÐµÑ‚Ðµ Ð¼ÐµÑ…Ð°Ð½Ð¸Ðº"
                title="Ð˜Ð·Ð±ÐµÑ€ÐµÑ‚Ðµ Ð¼ÐµÑ…Ð°Ð½Ð¸Ðº"
                className="w-full px-4 py-2 border border-borderSubtle rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">-- Ð˜Ð·Ð±ÐµÑ€ÐµÑ‚Ðµ Ð¼ÐµÑ…Ð°Ð½Ð¸Ðº --</option>
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
                Ð’ÑÐ¸Ñ‡ÐºÐ¸ Ð°ÐºÑ‚Ð¸Ð²Ð½Ð¸ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ¸ Ð¸ Ð·Ð°Ð´Ð°Ñ‡Ð¸ Ñ‰Ðµ Ð±ÑŠÐ´Ð°Ñ‚ Ð¿Ñ€ÐµÑ…Ð²ÑŠÑ€Ð»ÐµÐ½Ð¸ ÐºÑŠÐ¼ Ð½Ð¾Ð²Ð¸Ñ
                Ð¼ÐµÑ…Ð°Ð½Ð¸Ðº
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
            ÐžÑ‚ÐºÐ°Ð·
          </button>
          <button
            onClick={handleReassign}
            disabled={!selectedWorkerId || isSubmitting || availableWorkers.length === 0}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'ÐŸÑ€ÐµÐ½Ð°Ð·Ð½Ð°Ñ‡Ð°Ð²Ð°Ð½Ðµ...' : 'ÐŸÑ€ÐµÑ…Ð²ÑŠÑ€Ð»Ð¸ Ð¸ Ð¸Ð·Ñ‚Ñ€Ð¸Ð¹'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReassignWorkerModal;

