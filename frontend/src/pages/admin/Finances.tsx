import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowUp, ArrowDown, Edit, Trash2, X } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Finance {
  id: string;
  type: string;
  category: string;
  amount: string;
  description: string;
  date: string;
  notes: string | null;
}

interface EditFormData {
  type: string;
  category: string;
  amount: string;
  description: string;
  date: string;
}

const Finances = () => {
  const [finances, setFinances] = useState<Finance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFinance, setEditingFinance] = useState<Finance | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    type: 'EXPENSE',
    category: 'PARTS',
    amount: '',
    description: '',
    date: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchFinances();
  }, []);

  const fetchFinances = async () => {
    try {
      const response = await api.get('/finances');
      setFinances(response.data.finances || []);
    } catch {
      toast.error('Грешка при зареждане на транзакции');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      PARTS: 'Авточасти',
      CONSUMABLES: 'Консумативи',
      SALARY: 'Заплати',
      RENT: 'Наем',
      UTILITIES: 'Комунални услуги',
      SERVICES: 'Външни услуги',
      OTHER: 'Друго',
    };
    return labels[category] || category;
  };

  const handleEdit = (finance: Finance) => {
    setEditingFinance(finance);
    setEditFormData({
      type: finance.type,
      category: finance.category,
      amount: finance.amount,
      description: finance.description,
      date: new Date(finance.date).toISOString().split('T')[0],
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете тази транзакция?')) return;

    try {
      await api.delete(`/finances/${id}`);
      toast.success('Транзакцията е изтрита');
      fetchFinances();
    } catch {
      toast.error('Грешка при изтриване');
    }
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingFinance) return;

    setIsSaving(true);
    try {
      await api.put(`/finances/${editingFinance.id}`, {
        ...editFormData,
        amount: Number(editFormData.amount),
      });
      toast.success('Транзакцията е обновена');
      setIsEditModalOpen(false);
      fetchFinances();
    } catch {
      toast.error('Грешка при обновяване');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredFinances = finances.filter((finance) => {
    const matchesType = !typeFilter || finance.type === typeFilter;
    const matchesCategory = !categoryFilter || finance.category === categoryFilter;
    return matchesType && matchesCategory;
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">Транзакции</h1>
            <p className="text-textSecondary mt-1">Ръчно въведени приходи и разходи</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:ml-auto">
            <Button variant="secondary" onClick={() => navigate('/admin/finances/dashboard')} className="w-full sm:w-auto">
              Финансов преглед
            </Button>
            <Button onClick={() => navigate('/admin/finances/create')} className="w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Добави транзакция
            </Button>
          </div>
        </div>

        <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
            <select
              value={typeFilter}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Филтър по тип"
            >
              <option value="">Всички типове</option>
              <option value="INCOME">Приходи</option>
              <option value="EXPENSE">Разходи</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Филтър по категория"
            >
              <option value="">Всички категории</option>
              <option value="PARTS">Авточасти</option>
              <option value="CONSUMABLES">Консумативи</option>
              <option value="SALARY">Заплати</option>
              <option value="RENT">Наем</option>
              <option value="UTILITIES">Комунални услуги</option>
              <option value="SERVICES">Външни услуги</option>
              <option value="OTHER">Друго</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-3 px-3 sm:px-4 text-sm font-semibold text-textPrimary border-b border-borderSubtle">
                    Дата
                  </th>
                  <th className="text-left py-3 px-3 sm:px-4 text-sm font-semibold text-textPrimary border-b border-borderSubtle">
                    Тип
                  </th>
                  <th className="hidden md:table-cell text-left py-3 px-3 sm:px-4 text-sm font-semibold text-textPrimary border-b border-borderSubtle">
                    Категория
                  </th>
                  <th className="hidden lg:table-cell text-left py-3 px-3 sm:px-4 text-sm font-semibold text-textPrimary border-b border-borderSubtle">
                    Описание
                  </th>
                  <th className="text-right py-3 px-3 sm:px-4 text-sm font-semibold text-textPrimary border-b border-borderSubtle">
                    Сума
                  </th>
                  <th className="text-center py-3 px-3 sm:px-4 text-sm font-semibold text-textPrimary border-b border-borderSubtle w-24 sm:w-32">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredFinances.length > 0 ? (
                  filteredFinances.map((finance) => (
                    <tr key={finance.id} className="border-b border-borderSubtle hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3 sm:px-4 text-sm sm:text-base text-textSecondary">
                        {new Date(finance.date).toLocaleDateString('bg-BG')}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-sm sm:text-base">
                        {finance.type === 'INCOME' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            <ArrowUp className="w-3 h-3" />
                            Приход
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            <ArrowDown className="w-3 h-3" />
                            Разход
                          </span>
                        )}
                      </td>
                      <td className="hidden md:table-cell py-3 px-3 sm:px-4 text-sm sm:text-base text-textSecondary">
                        {getCategoryLabel(finance.category)}
                      </td>
                      <td className="hidden lg:table-cell py-3 px-3 sm:px-4 text-sm sm:text-base text-textPrimary">
                        {finance.description}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-right text-sm sm:text-base">
                        <span
                          className={`font-semibold ${
                            finance.type === 'INCOME' ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {finance.type === 'INCOME' ? '+' : '-'}
                          {Number(finance.amount).toFixed(2)} €
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(finance)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Редактирай"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(finance.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Изтрий"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-textSecondary text-sm sm:text-base">
                      Няма намерени транзакции
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingFinance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-borderSubtle p-4 sm:p-6 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-bold text-textPrimary">Редактиране на транзакция</h2>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Затвори"
                aria-label="Затвори диалога"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-type" className="block text-sm font-medium text-textPrimary mb-2">
                      Тип *
                    </label>
                    <select
                      id="edit-type"
                      value={editFormData.type}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        setEditFormData({ ...editFormData, type: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="INCOME">Приход</option>
                      <option value="EXPENSE">Разход</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="edit-category" className="block text-sm font-medium text-textPrimary mb-2">
                      Категория *
                    </label>
                    <select
                      id="edit-category"
                      value={editFormData.category}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        setEditFormData({ ...editFormData, category: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="PARTS">Авточасти</option>
                      <option value="CONSUMABLES">Консумативи</option>
                      <option value="SALARY">Заплати</option>
                      <option value="RENT">Наем</option>
                      <option value="UTILITIES">Комунални услуги</option>
                      <option value="SERVICES">Външни услуги</option>
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
                    value={editFormData.amount}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setEditFormData({ ...editFormData, amount: e.target.value })
                    }
                    required
                  />

                  <Input
                    label="Дата *"
                    type="date"
                    value={editFormData.date}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setEditFormData({ ...editFormData, date: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    Описание *
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      setEditFormData({ ...editFormData, description: e.target.value })
                    }
                    className="w-full px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={4}
                    placeholder="Въведете описание на транзакцията"
                    required
                    minLength={5}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                  Отказ
                </Button>
                <Button type="submit" isLoading={isSaving}>
                  Запази промени
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Finances;


