import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface FinanceFormData {
  type: string;
  category: string;
  amount: string;
  description: string;
  date: string;
}

const FinanceCreate = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FinanceFormData>({
    type: 'EXPENSE',
    category: 'PARTS',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await api.post('/finances', {
        ...formData,
        amount: Number(formData.amount),
      });
      toast.success('Транзакцията е добавена');
      navigate('/admin/finances');
    } catch {
      toast.error('Грешка при добавяне на транзакция');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/admin/finances')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Назад към транзакции"
            title="Назад към транзакции"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">Нова транзакция</h1>
            <p className="text-textSecondary mt-1">Добавете приход или разход</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6 max-w-2xl">
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-textPrimary mb-2">
                  Тип *
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="INCOME">Приход</option>
                  <option value="EXPENSE">Разход</option>
                </select>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-textPrimary mb-2">
                  Категория *
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="PARTS">Авточасти</option>
                  <option value="LABOR">Труд</option>
                  <option value="CONSUMABLES">Консумативи</option>
                  <option value="RENT">Наем</option>
                  <option value="UTILITIES">Комунални услуги</option>
                  <option value="SALARIES">Възнаграждения</option>
                  <option value="TAXES">Данъци</option>
                  <option value="INSURANCE">Застраховки</option>
                  <option value="MARKETING">Маркетинг</option>
                  <option value="MAINTENANCE">Поддръжка</option>
                  <option value="SUPPLIES">Офис консумативи</option>
                  <option value="OTHER">Друго</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Сума *"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="100.00"
                required
              />

              <Input
                label="Дата *"
                type="date"
                value={formData.date}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">
                Описание *
              </label>
              <textarea
                value={formData.description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={4}
                placeholder="Добавете описание на транзакцията..."
                required
                minLength={5}
                aria-label="Описание"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/finances')} className="w-full sm:w-auto">
              Отказ
            </Button>
            <Button type="submit" isLoading={isSaving} className="w-full sm:w-auto">
              Добави транзакция
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default FinanceCreate;


