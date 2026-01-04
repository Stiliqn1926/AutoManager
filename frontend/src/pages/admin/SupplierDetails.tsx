import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Phone, Mail, Globe, MapPin, Star, Power } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  totalPrice: number | null;
}

interface Supplier {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  isPreferred: boolean;
  contactPerson: string | null;
  phonePrimary: string;
  phoneSecondary: string | null;
  email: string | null;
  website: string | null;
  addressLine: string | null;
  city: string | null;
  vatNumber: string | null;
  eik: string | null;
  deliveryNotes: string | null;
  notes: string | null;
  lastOrderDate: string | null;
  createdAt: string;
  orders: Order[];
}

const SupplierDetails = () => {
  const { id } = useParams();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const response = await api.get(`/suppliers/${id}`);
        setSupplier(response.data.supplier);
      } catch {
        toast.error('Грешка при зареждане на доставчик');
        navigate('/admin/suppliers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupplier();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!supplier) return;
    if (!confirm(`Сигурни ли сте, че искате да изтриете "${supplier.name}"?`)) return;

    try {
      await api.delete(`/suppliers/${id}`);
      toast.success('Доставчикът е изтрит');
      navigate('/admin/suppliers');
    } catch {
      toast.error('Грешка при изтриване');
    }
  };

  const handleToggleActive = async () => {
    if (!supplier) return;

    try {
      await api.patch(`/suppliers/${id}/toggle-status`);
      toast.success(`Доставчикът е ${!supplier.isActive ? 'активиран' : 'деактивиран'}`);
      const response = await api.get(`/suppliers/${id}`);
      setSupplier(response.data.supplier);
    } catch {
      toast.error('Грешка при обновяване на статус');
    }
  };

  const handleTogglePreferred = async () => {
    if (!supplier) return;

    try {
      await api.patch(`/suppliers/${id}/toggle-preferred`);
      toast.success(
        `Доставчикът ${!supplier.isPreferred ? 'е маркиран' : 'не е маркиран'} като предпочитан`
      );
      const response = await api.get(`/suppliers/${id}`);
      setSupplier(response.data.supplier);
    } catch {
      toast.error('Грешка при обновяване');
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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[type as keyof typeof styles]}`}>
        {labels[type as keyof typeof labels]}
      </span>
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!supplier) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-textSecondary">Доставчикът не е намерен</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/suppliers')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Назад към доставчици"
            title="Назад към доставчици"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-textPrimary">{supplier.name}</h1>
              {supplier.isPreferred && (
                <div title="Предпочитан доставчик">
                  <Star className="w-6 h-6 text-primary fill-primary" />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              {getTypeBadge(supplier.type)}
              {supplier.isActive ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Активен
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                  Неактивен
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleTogglePreferred}>
              <Star className="w-4 h-4 mr-2" />
              {supplier.isPreferred ? 'Премахни от предпочитани' : 'Маркирай като предпочитан'}
            </Button>
            <Button variant="secondary" onClick={handleToggleActive}>
              <Power className="w-4 h-4 mr-2" />
              {supplier.isActive ? 'Деактивирай' : 'Активирай'}
            </Button>
            <Button onClick={() => navigate(`/admin/suppliers/${id}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Редактирай
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Изтрий
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Контакти */}
            <div className="bg-cardBg rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-semibold text-textPrimary mb-4">Контакти</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-textSecondary" />
                  <a href={`tel:${supplier.phonePrimary}`} className="text-primary hover:underline">
                    {supplier.phonePrimary}
                  </a>
                </div>
                {supplier.phoneSecondary && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-textSecondary" />
                    <a href={`tel:${supplier.phoneSecondary}`} className="text-primary hover:underline">
                      {supplier.phoneSecondary}
                    </a>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-textSecondary" />
                    <a href={`mailto:${supplier.email}`} className="text-primary hover:underline">
                      {supplier.email}
                    </a>
                  </div>
                )}
                {supplier.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-textSecondary" />
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {supplier.website}
                    </a>
                  </div>
                )}
                {supplier.contactPerson && (
                  <div className="mt-3 pt-3 border-t border-borderSubtle">
                    <p className="text-sm text-textSecondary">Лице за контакт</p>
                    <p className="font-medium text-textPrimary">{supplier.contactPerson}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Адрес и фирмени данни */}
            <div className="bg-cardBg rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-semibold text-textPrimary mb-4">Адрес и фирмени данни</h2>
              <div className="space-y-3">
                {(supplier.addressLine || supplier.city) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-textSecondary mt-1" />
                    <div>
                      {supplier.addressLine && (
                        <p className="text-textPrimary">{supplier.addressLine}</p>
                      )}
                      {supplier.city && <p className="text-textPrimary">{supplier.city}</p>}
                    </div>
                  </div>
                )}
                {supplier.eik && (
                  <div className="mt-3 pt-3 border-t border-borderSubtle">
                    <p className="text-sm text-textSecondary">ЕИК / Булстат</p>
                    <p className="font-medium text-textPrimary">{supplier.eik}</p>
                  </div>
                )}
                {supplier.vatNumber && (
                  <div>
                    <p className="text-sm text-textSecondary">ДДС номер</p>
                    <p className="font-medium text-textPrimary">{supplier.vatNumber}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Условия и бележки */}
            {(supplier.deliveryNotes || supplier.notes) && (
              <div className="bg-cardBg rounded-2xl shadow-card p-6">
                <h2 className="text-lg font-semibold text-textPrimary mb-4">Условия и бележки</h2>
                <div className="space-y-4">
                  {supplier.deliveryNotes && (
                    <div>
                      <p className="text-sm font-medium text-textSecondary mb-2">
                        Условия за доставка:
                      </p>
                      <p className="text-textPrimary bg-mainBg p-3 rounded-lg">
                        {supplier.deliveryNotes}
                      </p>
                    </div>
                  )}
                  {supplier.notes && (
                    <div>
                      <p className="text-sm font-medium text-textSecondary mb-2">Вътрешни бележки:</p>
                      <p className="text-textPrimary bg-mainBg p-3 rounded-lg">{supplier.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Информация */}
            <div className="bg-cardBg rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-semibold text-textPrimary mb-4">Информация</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-textSecondary">Създаден на</p>
                  <p className="font-medium text-textPrimary">
                    {new Date(supplier.createdAt).toLocaleString('bg-BG')}
                  </p>
                </div>
                {supplier.lastOrderDate && (
                  <div>
                    <p className="text-sm text-textSecondary">Последна поръчка</p>
                    <p className="font-medium text-textPrimary">
                      {new Date(supplier.lastOrderDate).toLocaleDateString('bg-BG')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Последни поръчки */}
            {supplier.orders && supplier.orders.length > 0 && (
              <div className="bg-cardBg rounded-2xl shadow-card p-6">
                <h2 className="text-lg font-semibold text-textPrimary mb-4">
                  Последни поръчки ({supplier.orders.length})
                </h2>
                <div className="space-y-2">
                  {supplier.orders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                      className="p-3 bg-mainBg rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <p className="font-medium text-textPrimary">{order.orderNumber}</p>
                      <p className="text-sm text-textSecondary">
                        {new Date(order.createdAt).toLocaleDateString('bg-BG')}
                      </p>
                      {order.totalPrice && (
                        <p className="text-sm font-medium text-primary">
                          {Number(order.totalPrice).toFixed(2)} лв.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SupplierDetails;