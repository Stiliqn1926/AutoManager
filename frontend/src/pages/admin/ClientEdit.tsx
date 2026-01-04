import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface ClientFormData {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
}

const ClientEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await api.get(`/clients/${id}`);
        const client = response.data.client;

        setFormData({
          firstName: client.firstName,
          lastName: client.lastName,
          phone: client.phone,
          address: client.address || '',
        });
      } catch {
        toast.error('Грешка при зареждане на клиент');
        navigate('/admin/clients');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClient();
  }, [id, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await api.put(`/clients/${id}`, formData);
      toast.success('Клиентът е обновен');
      navigate(`/admin/clients/${id}`);
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
            type="button"
            aria-label="Назад към детайли за клиента"
            title="Назад"
            onClick={() => navigate(`/admin/clients/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>

          <div>
            <h1 className="text-3xl font-bold text-textPrimary">
              Редактиране на клиент
            </h1>
            <p className="text-textSecondary mt-1">
              Обновете контактната информация
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
              label="Адрес"
              value={formData.address}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/admin/clients/${id}`)}
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

export default ClientEdit;
