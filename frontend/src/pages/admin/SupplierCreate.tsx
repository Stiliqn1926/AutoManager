import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface SupplierFormData {
  name: string;
  type: string;
  contactPerson: string;
  phonePrimary: string;
  phoneSecondary: string;
  email: string;
  website: string;
  addressLine: string;
  city: string;
  vatNumber: string;
  eik: string;
  deliveryNotes: string;
  notes: string;
  isPreferred: boolean;
}

const SupplierCreate = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    type: 'PARTS',
    contactPerson: '',
    phonePrimary: '',
    phoneSecondary: '',
    email: '',
    website: '',
    addressLine: '',
    city: '',
    vatNumber: '',
    eik: '',
    deliveryNotes: '',
    notes: '',
    isPreferred: false,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await api.post('/suppliers', formData);
      toast.success('Доставчикът е създаден');
      navigate('/admin/suppliers');
    } catch {
      toast.error('Грешка при създаване на доставчик');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/admin/suppliers')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors w-fit"
            aria-label="Назад към доставчици"
            title="Назад към доставчици"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">Нов доставчик</h1>
            <p className="text-textSecondary mt-1">Добавете нов доставчик на части и услуги</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6 max-w-4xl">
          <div className="space-y-4 sm:space-y-6">
            {/* Основна информация */}
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">Основна информация</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Име на доставчик *"
                  type="text"
                  value={formData.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />

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
                    <option value="PARTS">Части</option>
                    <option value="CONSUMABLES">Консумативи</option>
                    <option value="SERVICES">Услуги</option>
                    <option value="TIRES">Гуми</option>
                    <option value="OTHER">Друго</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Контакти */}
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">Контакти</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Телефон *"
                  type="tel"
                  value={formData.phonePrimary}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, phonePrimary: e.target.value })
                  }
                  placeholder="0888123456"
                  required
                />

                <Input
                  label="Втори телефон"
                  type="tel"
                  value={formData.phoneSecondary}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, phoneSecondary: e.target.value })
                  }
                  placeholder="0888654321"
                />

                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="info@supplier.com"
                />

                <Input
                  label="Лице за контакт"
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, contactPerson: e.target.value })
                  }
                  placeholder="Иван Иванов"
                />

                <Input
                  label="Уебсайт"
                  type="url"
                  value={formData.website}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="https://example.com"
                />
              </div>
            </div>

            {/* Адрес */}
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">Адрес</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Адрес"
                  type="text"
                  value={formData.addressLine}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, addressLine: e.target.value })
                  }
                  placeholder="ул. Примерна 123"
                />

                <Input
                  label="Град"
                  type="text"
                  value={formData.city}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="София"
                />
              </div>
            </div>

            {/* Фирмени данни */}
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">Фирмени данни</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="ЕИК / Булстат"
                  type="text"
                  value={formData.eik}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, eik: e.target.value })
                  }
                  placeholder="123456789"
                />

                <Input
                  label="ДДС номер"
                  type="text"
                  value={formData.vatNumber}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, vatNumber: e.target.value })
                  }
                  placeholder="BG123456789"
                />
              </div>
            </div>

            {/* Условия и бележки */}
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">Условия и бележки</h2>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    Условия за доставка
                  </label>
                  <textarea
                    value={formData.deliveryNotes}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData({ ...formData, deliveryNotes: e.target.value })
                    }
                    className="w-full px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={3}
                    placeholder="Доставка в същия ден, минимална поръчка 50 €..."
                    aria-label="Условия за доставка"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    Вътрешни бележки
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={3}
                    placeholder="Бързи, но скъпи. Имат отстъпка 10%..."
                    aria-label="Вътрешни бележки"
                  />
                </div>

                <div className="flex items-start sm:items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPreferred"
                    checked={formData.isPreferred}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, isPreferred: e.target.checked })
                    }
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="isPreferred" className="text-sm text-textPrimary cursor-pointer">
                    Маркирай като предпочитан доставчик
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/suppliers')} className="w-full sm:w-auto">
              Отказ
            </Button>
            <Button type="submit" isLoading={isSaving} className="w-full sm:w-auto">
              Създай доставчик
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default SupplierCreate;


