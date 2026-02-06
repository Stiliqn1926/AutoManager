import { useState, useEffect, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Star, Phone, Mail } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Supplier {
  id: string;
  name: string;
  type: string;
  phonePrimary: string;
  email: string | null;
  contactPerson: string | null;
  city: string | null;
  isActive: boolean;
  isPreferred: boolean;
  lastOrderDate: string | null;
}

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [preferredFilter, setPreferredFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data.suppliers || []);
    } catch {
      toast.error('Грешка при зареждане на доставчици');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      PARTS: 'bg-blue-100 text-blue-800',
      CONSUMABLES: 'bg-green-100 text-green-800',
      SERVICES: 'bg-purple-100 text-purple-800',
      TIRES: 'bg-gray-100 text-gray-800',
      OTHER: 'bg-yellow-100 text-yellow-800',
    };
    const labels = {
      PARTS: 'Части',
      CONSUMABLES: 'Консумативи',
      SERVICES: 'Услуги',
      TIRES: 'Гуми',
      OTHER: 'Друго',
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[type as keyof typeof styles]
        }`}
      >
        {labels[type as keyof typeof labels]}
      </span>
    );
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    const searchLower = searchTerm.toLowerCase().trim();
    const tokens = searchLower.split(/\s+/).filter(Boolean);
    const matchesSearch = tokens.length === 0
      ? true
      : tokens.every((token) =>
        [
          supplier.name,
          supplier.phonePrimary,
          supplier.email || '',
          supplier.contactPerson || '',
        ].some((value) => value.toLowerCase().startsWith(token))
      );

    const matchesType = !typeFilter || supplier.type === typeFilter;
    const matchesActive =
      activeFilter === '' || supplier.isActive.toString() === activeFilter;
    const matchesPreferred =
      preferredFilter === '' ||
      supplier.isPreferred.toString() === preferredFilter;

    return matchesSearch && matchesType && matchesActive && matchesPreferred;
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
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">Доставчици</h1>
            <p className="text-textSecondary mt-1">
              Управление на доставчици на части и услуги
            </p>
          </div>
          <Button onClick={() => navigate('/admin/suppliers/create')} className="w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Добави доставчик
          </Button>
        </div>

        <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textSecondary w-5 h-5" />
                <input
                  type="text"
                  placeholder="Търси по име, телефон, email..."
                  value={searchTerm}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setSearchTerm(e.target.value)
                  }
                  className="w-full pl-10 pr-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Търсене"
                />
              </div>
            </div>

            <select
              value={typeFilter}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setTypeFilter(e.target.value)
              }
              className="w-full sm:w-auto px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Филтър по тип"
            >
              <option value="">Всички типове</option>
              <option value="PARTS">Части</option>
              <option value="CONSUMABLES">Консумативи</option>
              <option value="SERVICES">Услуги</option>
              <option value="TIRES">Гуми</option>
              <option value="OTHER">Друго</option>
            </select>

            <select
              value={activeFilter}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setActiveFilter(e.target.value)
              }
              className="w-full sm:w-auto px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Филтър по статус"
            >
              <option value="">Всички статуси</option>
              <option value="true">Активен</option>
              <option value="false">Неактивен</option>
            </select>

            <select
              value={preferredFilter}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setPreferredFilter(e.target.value)
              }
              className="w-full sm:w-auto px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Филтър по предпочитан"
            >
              <option value="">Всички</option>
              <option value="true">Предпочитани</option>
              <option value="false">Не предпочитани</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-textPrimary border-b border-borderSubtle w-8"></th>
                  <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-textPrimary border-b border-borderSubtle">
                    Име
                  </th>
                  <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-textPrimary border-b border-borderSubtle">
                    Тип
                  </th>
                  <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-textPrimary border-b border-borderSubtle">
                    Телефон
                  </th>
                  <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-textPrimary border-b border-borderSubtle">
                    Email
                  </th>
                  <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-textPrimary border-b border-borderSubtle">
                    Контакт
                  </th>
                  <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-textPrimary border-b border-borderSubtle">
                    Град
                  </th>
                  <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-textPrimary border-b border-borderSubtle">
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      onClick={() => navigate(`/admin/suppliers/${supplier.id}`)}
                      className="border-b border-borderSubtle hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 sm:px-4">
                        {supplier.isPreferred && (
                          <Star className="w-4 h-4 text-primary fill-primary" />
                        )}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-sm sm:text-base text-textPrimary font-medium">
                        {supplier.name}
                      </td>
                      <td className="py-3 px-3 sm:px-4">{getTypeBadge(supplier.type)}</td>

                      <td className="py-3 px-3 sm:px-4 text-sm sm:text-base text-textSecondary">
                        <a
                          href={`tel:${supplier.phonePrimary}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          <Phone className="w-3 h-3" />
                          {supplier.phonePrimary}
                        </a>
                      </td>

                      <td className="py-3 px-3 sm:px-4 text-sm sm:text-base text-textSecondary">
                        {supplier.email ? (
                          <a
                            href={`mailto:${supplier.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 hover:text-primary"
                          >
                            <Mail className="w-3 h-3" />
                            {supplier.email}
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="py-3 px-3 sm:px-4 text-sm sm:text-base text-textSecondary">
                        {supplier.contactPerson || '-'}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-sm sm:text-base text-textSecondary">{supplier.city || '-'}</td>
                      <td className="py-3 px-3 sm:px-4">
                        {supplier.isActive ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Активен
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                            Неактивен
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-textSecondary">
                      Няма намерени доставчици
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Suppliers;

