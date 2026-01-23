import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Mail, Phone, Wrench } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  specialization: string | null;
  skills: string | null;
  createdAt: string;
  membershipStatus: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  joinedAt: string;
  leftAt: string | null;
  user: {
    email: string;
  };
}

const WorkerDetails = () => {
  const { id } = useParams();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorker = async () => {
      try {
        const response = await api.get(`/workers/${id}`);
        setWorker(response.data.worker);
      } catch {
        toast.error('Грешка при зареждане на работник');
        navigate('/admin/workers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorker();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!worker) return;

    const isActive = worker.membershipStatus === 'ACTIVE';
    const confirmMessage = isActive
      ? `Сигурни ли сте, че искате да премахнете ${worker.firstName} ${worker.lastName} от сервиза?`
      : `Сигурни ли сте, че искате да изтриете напълно ${worker.firstName} ${worker.lastName}?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      if (isActive) {
        // Премахни от сервиз (маркирай като INACTIVE)
        await api.post(`/workers/${id}/remove-from-service`);
        toast.success('Механикът е премахнат от сервиза');
      } else {
        // Изтрий напълно
        await api.delete(`/workers/${id}/permanent`);
        toast.success('Механикът е изтрит напълно');
      }
      navigate('/admin/workers');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Грешка при операцията';
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!worker) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-textSecondary">Работникът не е намерен</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/workers')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Назад към списъка с работници"
            title="Назад"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-textPrimary">
              {worker.firstName} {worker.lastName}
            </h1>
            <p className="text-textSecondary mt-1">
              Детайли за работник
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
              {worker.membershipStatus === 'ACTIVE' ? 'Премахни от сервиз' : 'Изтрий'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-cardBg rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-semibold text-textPrimary mb-4">
                Основна информация
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-textMuted" />
                  <div>
                    <p className="text-sm text-textSecondary">Email</p>
                    <p className="font-medium text-textPrimary">
                      {worker.user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-textMuted" />
                  <div>
                    <p className="text-sm text-textSecondary">Телефон</p>
                    <p className="font-medium text-textPrimary">
                      {worker.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Wrench className="w-5 h-5 text-textMuted" />
                  <div>
                    <p className="text-sm text-textSecondary">
                      Специализация
                    </p>
                    <p className="font-medium text-textPrimary">
                      {worker.specialization || 'Не е посочена'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {worker.skills && (
              <div className="bg-cardBg rounded-2xl shadow-card p-6">
                <h2 className="text-lg font-semibold text-textPrimary mb-4">
                  Умения
                </h2>
                <p className="text-textSecondary">{worker.skills}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-cardBg rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-semibold text-textPrimary mb-4">
                Статистика
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-textSecondary">
                    Дата на наемане
                  </p>
                  <p className="font-medium text-textPrimary">
                    {new Date(worker.createdAt).toLocaleDateString('bg-BG')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default WorkerDetails;
