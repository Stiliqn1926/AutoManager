import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string | null;
}

const WorkersList = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const response = await api.get('/workers');
        setWorkers(response.data.workers || []);
      } catch  {
        toast.error('Грешка при зареждане на механици');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">Последно добавени механици</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-textPrimary">Последно добавени механици</h2>
        <button
          onClick={() => navigate('/admin/workers')}
          className="text-sm text-primary hover:text-primary-700 font-medium"
        >
          Виж всички →
        </button>
      </div>

      {workers.length === 0 ? (
        <p className="text-textSecondary text-center py-8">Няма механици</p>
      ) : (
        <div className="space-y-2">
          {workers.slice(0, 5).map((worker) => (
            <div
              key={worker.id}
              onClick={() => navigate(`/admin/workers/${worker.id}`)}
              className="flex items-center gap-3 p-3 bg-mainBg rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <div className="bg-primary p-2 rounded-lg">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-textPrimary text-sm">
                  {worker.firstName} {worker.lastName}
                </p>
                {worker.specialization && (
                  <p className="text-xs text-textMuted">{worker.specialization}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkersList;
