import { useNavigate } from 'react-router-dom';
import { Building2, Plus, User, Trash2 } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const NoActiveServiceScreen = () => {
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (!window.confirm('Ð’ÐÐ˜ÐœÐÐÐ˜Ð•!\n\nÐ¢Ð¾Ð²Ð° Ñ‰Ðµ Ð¸Ð·Ñ‚Ñ€Ð¸Ðµ Ð°ÐºÐ°ÑƒÐ½Ñ‚Ð° Ñ‚Ð¸ Ð½Ð°Ð¿ÑŠÐ»Ð½Ð¾.\n\nÐ¡Ð¸Ð³ÑƒÑ€ÐµÐ½ Ð»Ð¸ ÑÐ¸?')) {
      return;
    }

    try {
      await api.delete('/auth/delete-account');
      toast.success('ÐÐºÐ°ÑƒÐ½Ñ‚ÑŠÑ‚ Ðµ Ð¸Ð·Ñ‚Ñ€Ð¸Ñ‚ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾');

      localStorage.clear();
      navigate('/');
      window.location.reload();
    } catch (error: unknown) {
  const err = error as { response?: { data?: { message?: string } } };
  const message = err.response?.data?.message || 'Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¸Ð·Ñ‚Ñ€Ð¸Ð²Ð°Ð½Ðµ Ð½Ð° Ð°ÐºÐ°ÑƒÐ½Ñ‚';
  toast.error(message);
}
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-4 sm:p-8 text-center">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Building2 className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-textPrimary mb-2">
            Ð”Ð¾Ð±Ñ€Ðµ Ð´Ð¾ÑˆÑŠÐ», ÐœÐµÑ…Ð°Ð½Ð¸Ðº
          </h1>
          <p className="text-textSecondary">
            ÐÑÐ¼Ð°Ñˆ Ð°ÐºÑ‚Ð¸Ð²Ð½Ð¸ ÑÐµÑ€Ð²Ð¸Ð·Ð¸ Ð² Ð¼Ð¾Ð¼ÐµÐ½Ñ‚Ð°
          </p>
        </div>

        <div className="bg-white rounded-xl border border-borderSubtle p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-textPrimary mb-4">
            ÐšÐ°ÐºÐ²Ð¾ Ð¼Ð¾Ð¶ÐµÑˆ Ð´Ð° Ð½Ð°Ð¿Ñ€Ð°Ð²Ð¸Ñˆ?
          </h2>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/mechanic/service-settings')}
              className="w-full flex items-center justify-center gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Ð—Ð°ÑÐ²Ð¸ Ð½Ð¾Ð² ÑÐµÑ€Ð²Ð¸Ð·
            </button>

            <button
              onClick={() => navigate('/mechanic/profile')}
              className="w-full flex items-center justify-center gap-3 px-4 sm:px-6 py-3 sm:py-4 border border-borderSubtle rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <User className="w-5 h-5" />
              Ð’Ð¸Ð¶ Ð¿Ñ€Ð¾Ñ„Ð¸Ð»Ð° ÑÐ¸
            </button>

            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-center gap-3 px-4 sm:px-6 py-3 sm:py-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
            >
              <Trash2 className="w-5 h-5" />
              Ð˜Ð·Ñ‚Ñ€Ð¸Ð¹ Ð°ÐºÐ°ÑƒÐ½Ñ‚Ð° ÑÐ¸
            </button>
          </div>
        </div>

        <div className="text-sm text-textSecondary">
          <p>Ð—Ð° Ð´Ð° Ð·Ð°Ð¿Ð¾Ñ‡Ð½ÐµÑˆ Ñ€Ð°Ð±Ð¾Ñ‚Ð°, Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° ÑÐµ Ð¿Ñ€Ð¸ÑÑŠÐµÐ´Ð¸Ð½Ð¸Ñˆ ÐºÑŠÐ¼ ÑÐµÑ€Ð²Ð¸Ð·.</p>
          <p className="mt-2">ÐÐºÐ¾ Ð¸Ð¼Ð°Ñˆ Ð²ÑŠÐ¿Ñ€Ð¾ÑÐ¸, ÑÐ²ÑŠÑ€Ð¶Ð¸ ÑÐµ Ñ Ð°Ð´Ð¼Ð¸Ð½Ð¸ÑÑ‚Ñ€Ð°Ñ‚Ð¾Ñ€Ð° Ð½Ð° Ñ‚Ð²Ð¾Ñ ÑÐµÑ€Ð²Ð¸Ð·.</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default NoActiveServiceScreen;

