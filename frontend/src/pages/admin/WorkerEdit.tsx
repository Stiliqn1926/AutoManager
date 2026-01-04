import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface WorkerFormData {
  firstName: string;
  lastName: string;
  phone: string;
  specialization: string;
  skills: string;
}

const WorkerEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<WorkerFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    specialization: '',
    skills: '',
  });

  useEffect(() => {
    const fetchWorker = async () => {
      try {
        const response = await api.get(`/workers/${id}`);
        const worker = response.data.worker;

        setFormData({
          firstName: worker.firstName,
          lastName: worker.lastName,
          phone: worker.phone,
          specialization: worker.specialization || '',
          skills: worker.skills || '',
        });
      } catch {
        toast.error('Грешка при зареждане на работник');
        navigate('/admin/workers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorker();
  }, [id, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await api.put(`/workers/${id}`, formData);
      toast.success('Работникът е обновен');
      navigate(`/admin/workers/${id}`);
    } catch {
      toast.error('Грешка при обновяване');
    } finally {
      setIsSaving(false);
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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/admin/workers/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Назад към детайли за работника"
            title="Назад"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>

          <div>
            <h1 className="text-3xl font-bold text-textPrimary">
              Редактиране на работник
            </h1>
            <p className="text-textSecondary mt-1">
              Обновете информацията
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-cardBg rounded-2xl shadow-card p-6 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Име *"
                value={formData.firstName}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
              />

              <Input
                label="Фамилия *"
                value={formData.lastName}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
              />
            </div>

            <Input
              label="Телефон *"
              value={formData.phone}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
            />

            <Input
              label="Специализация"
              value={formData.specialization}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, specialization: e.target.value })
              }
            />

            {/* Skills textarea */}
            <div>
              <label
                htmlFor="worker-skills"
                className="block text-sm font-medium text-textPrimary mb-1"
              >
                Умения
              </label>
              <textarea
                id="worker-skills"
                value={formData.skills}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, skills: e.target.value })
                }
                className="w-full px-4 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/admin/workers/${id}`)}
              >
                Отказ
              </Button>
              <Button type="submit" isLoading={isSaving}>
                Запази
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default WorkerEdit;
