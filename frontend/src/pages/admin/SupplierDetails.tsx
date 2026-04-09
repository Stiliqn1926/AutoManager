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
  displayOrderNumber?: string | null;
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
        toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° Ð´Ð¾ÑÑ‚Ð°Ð²Ñ‡Ð¸Ðº');
        navigate('/admin/suppliers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupplier();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!supplier) return;
    if (!confirm(`Ð¡Ð¸Ð³ÑƒÑ€Ð½Ð¸ Ð»Ð¸ ÑÑ‚Ðµ, Ñ‡Ðµ Ð¸ÑÐºÐ°Ñ‚Ðµ Ð´Ð° Ð¸Ð·Ñ‚Ñ€Ð¸ÐµÑ‚Ðµ "${supplier.name}"?`)) return;

    try {
      await api.delete(`/suppliers/${id}`);
      toast.success('Ð”Ð¾ÑÑ‚Ð°Ð²Ñ‡Ð¸ÐºÑŠÑ‚ Ðµ Ð¸Ð·Ñ‚Ñ€Ð¸Ñ‚');
      navigate('/admin/suppliers');
    } catch {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¸Ð·Ñ‚Ñ€Ð¸Ð²Ð°Ð½Ðµ');
    }
  };

  const handleToggleActive = async () => {
    if (!supplier) return;

    try {
      await api.patch(`/suppliers/${id}/toggle-status`);
      toast.success(`Ð”Ð¾ÑÑ‚Ð°Ð²Ñ‡Ð¸ÐºÑŠÑ‚ Ðµ ${!supplier.isActive ? 'Ð°ÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ð½' : 'Ð´ÐµÐ°ÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ð½'}`);
      const response = await api.get(`/suppliers/${id}`);
      setSupplier(response.data.supplier);
    } catch {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¾Ð±Ð½Ð¾Ð²ÑÐ²Ð°Ð½Ðµ Ð½Ð° ÑÑ‚Ð°Ñ‚ÑƒÑ');
    }
  };

  const handleTogglePreferred = async () => {
    if (!supplier) return;

    try {
      await api.patch(`/suppliers/${id}/toggle-preferred`);
      toast.success(
        `Ð”Ð¾ÑÑ‚Ð°Ð²Ñ‡Ð¸ÐºÑŠÑ‚ ${!supplier.isPreferred ? 'Ðµ Ð¼Ð°Ñ€ÐºÐ¸Ñ€Ð°Ð½' : 'Ð½Ðµ Ðµ Ð¼Ð°Ñ€ÐºÐ¸Ñ€Ð°Ð½'} ÐºÐ°Ñ‚Ð¾ Ð¿Ñ€ÐµÐ´Ð¿Ð¾Ñ‡Ð¸Ñ‚Ð°Ð½`
      );
      const response = await api.get(`/suppliers/${id}`);
      setSupplier(response.data.supplier);
    } catch {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¾Ð±Ð½Ð¾Ð²ÑÐ²Ð°Ð½Ðµ');
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
      PARTS: 'Ð§Ð°ÑÑ‚Ð¸',
      CONSUMABLES: 'ÐšÐ¾Ð½ÑÑƒÐ¼Ð°Ñ‚Ð¸Ð²Ð¸',
      SERVICES: 'Ð£ÑÐ»ÑƒÐ³Ð¸',
      TIRES: 'Ð“ÑƒÐ¼Ð¸',
      OTHER: 'Ð”Ñ€ÑƒÐ³Ð¾',
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
          <p className="text-textSecondary">Ð”Ð¾ÑÑ‚Ð°Ð²Ñ‡Ð¸ÐºÑŠÑ‚ Ð½Ðµ Ðµ Ð½Ð°Ð¼ÐµÑ€ÐµÐ½</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/admin/suppliers')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors w-fit"
            aria-label="ÐÐ°Ð·Ð°Ð´ ÐºÑŠÐ¼ Ð´Ð¾ÑÑ‚Ð°Ð²Ñ‡Ð¸Ñ†Ð¸"
            title="ÐÐ°Ð·Ð°Ð´ ÐºÑŠÐ¼ Ð´Ð¾ÑÑ‚Ð°Ð²Ñ‡Ð¸Ñ†Ð¸"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">{supplier.name}</h1>
              {supplier.isPreferred && (
                <div title="ÐŸÑ€ÐµÐ´Ð¿Ð¾Ñ‡Ð¸Ñ‚Ð°Ð½ Ð´Ð¾ÑÑ‚Ð°Ð²Ñ‡Ð¸Ðº">
                  <Star className="w-6 h-6 text-primary fill-primary" />
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {getTypeBadge(supplier.type)}
              {supplier.isActive ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  ÐÐºÑ‚Ð¸Ð²ÐµÐ½
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                  ÐÐµÐ°ÐºÑ‚Ð¸Ð²ÐµÐ½
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" onClick={handleTogglePreferred} className="w-full sm:w-auto">
              <Star className="w-4 h-4" />
              {supplier.isPreferred ? 'ÐŸÑ€ÐµÐ¼Ð°Ñ…Ð½Ð¸ Ð¾Ñ‚ Ð¿Ñ€ÐµÐ´Ð¿Ð¾Ñ‡Ð¸Ñ‚Ð°Ð½Ð¸' : 'ÐœÐ°Ñ€ÐºÐ¸Ñ€Ð°Ð¹ ÐºÐ°Ñ‚Ð¾ Ð¿Ñ€ÐµÐ´Ð¿Ð¾Ñ‡Ð¸Ñ‚Ð°Ð½'}
            </Button>
            <Button variant="secondary" onClick={handleToggleActive} className="w-full sm:w-auto">
              <Power className="w-4 h-4" />
              {supplier.isActive ? 'Ð”ÐµÐ°ÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ð¹' : 'ÐÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ð¹'}
            </Button>
            <Button onClick={() => navigate(`/admin/suppliers/${id}/edit`)} className="w-full sm:w-auto">
              <Edit className="w-4 h-4" />
              Ð ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð°Ð¹
            </Button>
            <Button variant="danger" onClick={handleDelete} className="w-full sm:w-auto">
              <Trash2 className="w-4 h-4" />
              Ð˜Ð·Ñ‚Ñ€Ð¸Ð¹
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">ÐšÐ¾Ð½Ñ‚Ð°ÐºÑ‚Ð¸</h2>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Phone className="w-5 h-5 text-textSecondary" />
                  <a href={`tel:${supplier.phonePrimary}`} className="text-primary hover:underline">
                    {supplier.phonePrimary}
                  </a>
                </div>
                {supplier.phoneSecondary && (
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Phone className="w-5 h-5 text-textSecondary" />
                    <a href={`tel:${supplier.phoneSecondary}`} className="text-primary hover:underline">
                      {supplier.phoneSecondary}
                    </a>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Mail className="w-5 h-5 text-textSecondary" />
                    <a href={`mailto:${supplier.email}`} className="text-primary hover:underline">
                      {supplier.email}
                    </a>
                  </div>
                )}
                {supplier.website && (
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
                    <p className="text-sm text-textSecondary">Ð›Ð¸Ñ†Ðµ Ð·Ð° ÐºÐ¾Ð½Ñ‚Ð°ÐºÑ‚</p>
                    <p className="font-medium text-textPrimary">{supplier.contactPerson}</p>
                  </div>
                )}
              </div>
            </div>

            
            <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">ÐÐ´Ñ€ÐµÑ Ð¸ Ñ„Ð¸Ñ€Ð¼ÐµÐ½Ð¸ Ð´Ð°Ð½Ð½Ð¸</h2>
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
                    <p className="text-sm text-textSecondary">Ð•Ð˜Ðš / Ð‘ÑƒÐ»ÑÑ‚Ð°Ñ‚</p>
                    <p className="font-medium text-textPrimary">{supplier.eik}</p>
                  </div>
                )}
                {supplier.vatNumber && (
                  <div>
                    <p className="text-sm text-textSecondary">Ð”Ð”Ð¡ Ð½Ð¾Ð¼ÐµÑ€</p>
                    <p className="font-medium text-textPrimary">{supplier.vatNumber}</p>
                  </div>
                )}
              </div>
            </div>

            
            {(supplier.deliveryNotes || supplier.notes) && (
              <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">Ð£ÑÐ»Ð¾Ð²Ð¸Ñ Ð¸ Ð±ÐµÐ»ÐµÐ¶ÐºÐ¸</h2>
                <div className="space-y-3 sm:space-y-4">
                  {supplier.deliveryNotes && (
                    <div>
                      <p className="text-sm font-medium text-textSecondary mb-2">
                        Ð£ÑÐ»Ð¾Ð²Ð¸Ñ Ð·Ð° Ð´Ð¾ÑÑ‚Ð°Ð²ÐºÐ°:
                      </p>
                      <p className="text-textPrimary bg-mainBg p-3 rounded-lg">
                        {supplier.deliveryNotes}
                      </p>
                    </div>
                  )}
                  {supplier.notes && (
                    <div>
                      <p className="text-sm font-medium text-textSecondary mb-2">Ð’ÑŠÑ‚Ñ€ÐµÑˆÐ½Ð¸ Ð±ÐµÐ»ÐµÐ¶ÐºÐ¸:</p>
                      <p className="text-textPrimary bg-mainBg p-3 rounded-lg">{supplier.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 sm:space-y-6">
            
            <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">Ð˜Ð½Ñ„Ð¾Ñ€Ð¼Ð°Ñ†Ð¸Ñ</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-textSecondary">Ð¡ÑŠÐ·Ð´Ð°Ð´ÐµÐ½ Ð½Ð°</p>
                  <p className="font-medium text-textPrimary">
                    {new Date(supplier.createdAt).toLocaleString('bg-BG')}
                  </p>
                </div>
                {supplier.lastOrderDate && (
                  <div>
                    <p className="text-sm text-textSecondary">ÐŸÐ¾ÑÐ»ÐµÐ´Ð½Ð° Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ°</p>
                    <p className="font-medium text-textPrimary">
                      {new Date(supplier.lastOrderDate).toLocaleDateString('bg-BG')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            
            {supplier.orders && supplier.orders.length > 0 && (
              <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">
                  ÐŸÐ¾ÑÐ»ÐµÐ´Ð½Ð¸ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ¸ ({supplier.orders.length})
                </h2>
                <div className="space-y-2">
                  {supplier.orders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                      className="p-3 bg-mainBg rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <p className="font-medium text-textPrimary">{order.displayOrderNumber || order.orderNumber}</p>
                      <p className="text-sm text-textSecondary">
                        {new Date(order.createdAt).toLocaleDateString('bg-BG')}
                      </p>
                      {order.totalPrice && (
                        <p className="text-sm font-medium text-primary">
                          {Number(order.totalPrice).toFixed(2)} â‚¬
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


