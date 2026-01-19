import { useNavigate } from 'react-router-dom';
import { Building2, Plus, User, Trash2 } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const NoServiceScreen = () => {
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (!window.confirm('ВНИМАНИЕ!\n\nТова ще изтрие акаунта ти напълно.\n\nСигурен ли си?')) {
      return;
    }

    try {
      await api.delete('/auth/delete-account');
      toast.success('Акаунтът е изтрит успешно');

      localStorage.clear();
      navigate('/');
      window.location.reload();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Грешка при изтриване на акаунт';
      toast.error(message);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Building2 className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-textPrimary mb-2">
            Добре дошъл
          </h1>
          <p className="text-textSecondary">
            Нямаш добавени сервизи в момента
          </p>
        </div>

        <div className="bg-white rounded-xl border border-borderSubtle p-6 mb-6">
          <h2 className="text-lg font-semibold text-textPrimary mb-4">
            Какво можеш да направиш?
          </h2>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/client/service-companies')}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Добави сервиз
            </button>

            <button
              onClick={() => navigate('/client/profile')}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 border border-borderSubtle rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <User className="w-5 h-5" />
              Виж профила си
            </button>

            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
            >
              <Trash2 className="w-5 h-5" />
              Изтрий акаунта си
            </button>
          </div>
        </div>

        <div className="text-sm text-textSecondary">
          <p>За да започнеш да използваш системата, добави сервиз с уникален код.</p>
          <p className="mt-2">След одобрение от администратора ще имаш достъп до всички функции.</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default NoServiceScreen;