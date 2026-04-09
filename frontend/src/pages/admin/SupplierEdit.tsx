import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  isActive: boolean;
  isPreferred: boolean;
}

const SupplierEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
    isActive: true,
    isPreferred: false,
  });

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const response = await api.get(`/suppliers/${id}`);
        const supplier = response.data.supplier;

        setFormData({
          name: supplier.name,
          type: supplier.type,
          contactPerson: supplier.contactPerson || '',
          phonePrimary: supplier.phonePrimary,
          phoneSecondary: supplier.phoneSecondary || '',
          email: supplier.email || '',
          website: supplier.website || '',
          addressLine: supplier.addressLine || '',
          city: supplier.city || '',
          vatNumber: supplier.vatNumber || '',
          eik: supplier.eik || '',
          deliveryNotes: supplier.deliveryNotes || '',
          notes: supplier.notes || '',
          isActive: supplier.isActive,
          isPreferred: supplier.isPreferred,
        });
      } catch {
        toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° Ð´Ð¾ÑÑ‚Ð°Ð²Ñ‡Ð¸Ðº');
        navigate('/admin/suppliers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupplier();
  }, [id, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await api.put(`/suppliers/${id}`, formData);
      toast.success('Ð”Ð¾ÑÑ‚Ð°Ð²Ñ‡Ð¸ÐºÑŠÑ‚ Ðµ Ð¾Ð±Ð½Ð¾Ð²ÐµÐ½');
      navigate(`/admin/suppliers/${id}`);
    } catch {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¾Ð±Ð½Ð¾Ð²ÑÐ²Ð°Ð½Ðµ Ð½Ð° Ð´Ð¾ÑÑ‚Ð°Ð²Ñ‡Ð¸Ðº');
    } finally {
      setIsSaving(false);
    }
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

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate(`/admin/suppliers/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors w-fit"
            aria-label="ÐÐ°Ð·Ð°Ð´ ÐºÑŠÐ¼ Ð´Ð¾ÑÑ‚Ð°Ð²Ñ‡Ð¸ÐºÐ°"
            title="ÐÐ°Ð·Ð°Ð´ ÐºÑŠÐ¼ Ð´Ð¾ÑÑ‚Ð°Ð²Ñ‡Ð¸ÐºÐ°"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">Ð ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð°Ð½Ðµ Ð½Ð° Ð´Ð¾ÑÑ‚Ð°Ð²Ñ‡Ð¸Ðº</h1>
            <p className="text-textSecondary mt-1">ÐžÐ±Ð½Ð¾Ð²ÐµÑ‚Ðµ Ð¸Ð½Ñ„Ð¾Ñ€Ð¼Ð°Ñ†Ð¸ÑÑ‚Ð° Ð·Ð° Ð´Ð¾ÑÑ‚Ð°Ð²Ñ‡Ð¸ÐºÐ°</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6 max-w-4xl">
          <div className="space-y-4 sm:space-y-6">
            
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">ÐžÑÐ½Ð¾Ð²Ð½Ð° Ð¸Ð½Ñ„Ð¾Ñ€Ð¼Ð°Ñ†Ð¸Ñ</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Ð˜Ð¼Ðµ Ð½Ð° Ð´Ð¾ÑÑ‚Ð°Ð²Ñ‡Ð¸Ðº *"
                  type="text"
                  value={formData.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-textPrimary mb-2">
                    Ð¢Ð¸Ð¿ *
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
                    <option value="PARTS">Ð§Ð°ÑÑ‚Ð¸</option>
                    <option value="CONSUMABLES">ÐšÐ¾Ð½ÑÑƒÐ¼Ð°Ñ‚Ð¸Ð²Ð¸</option>
                    <option value="SERVICES">Ð£ÑÐ»ÑƒÐ³Ð¸</option>
                    <option value="TIRES">Ð“ÑƒÐ¼Ð¸</option>
                    <option value="OTHER">Ð”Ñ€ÑƒÐ³Ð¾</option>
                  </select>
                </div>
              </div>
            </div>

            
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">ÐšÐ¾Ð½Ñ‚Ð°ÐºÑ‚Ð¸</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½ *"
                  type="tel"
                  value={formData.phonePrimary}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, phonePrimary: e.target.value })
                  }
                  placeholder="0888123456"
                  required
                />

                <Input
                  label="Ð’Ñ‚Ð¾Ñ€Ð¸ Ñ‚ÐµÐ»ÐµÑ„Ð¾Ð½"
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
                  label="Ð›Ð¸Ñ†Ðµ Ð·Ð° ÐºÐ¾Ð½Ñ‚Ð°ÐºÑ‚"
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, contactPerson: e.target.value })
                  }
                  placeholder="Ð˜Ð²Ð°Ð½ Ð˜Ð²Ð°Ð½Ð¾Ð²"
                />

                <Input
                  label="Ð£ÐµÐ±ÑÐ°Ð¹Ñ‚"
                  type="url"
                  value={formData.website}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="https://example.com"
                />
              </div>
            </div>

            
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">ÐÐ´Ñ€ÐµÑ</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="ÐÐ´Ñ€ÐµÑ"
                  type="text"
                  value={formData.addressLine}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, addressLine: e.target.value })
                  }
                  placeholder="ÑƒÐ». ÐŸÑ€Ð¸Ð¼ÐµÑ€Ð½Ð° 123"
                />

                <Input
                  label="Ð“Ñ€Ð°Ð´"
                  type="text"
                  value={formData.city}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="Ð¡Ð¾Ñ„Ð¸Ñ"
                />
              </div>
            </div>

            
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">Ð¤Ð¸Ñ€Ð¼ÐµÐ½Ð¸ Ð´Ð°Ð½Ð½Ð¸</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Ð•Ð˜Ðš / Ð‘ÑƒÐ»ÑÑ‚Ð°Ñ‚"
                  type="text"
                  value={formData.eik}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, eik: e.target.value })
                  }
                  placeholder="123456789"
                />

                <Input
                  label="Ð”Ð”Ð¡ Ð½Ð¾Ð¼ÐµÑ€"
                  type="text"
                  value={formData.vatNumber}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, vatNumber: e.target.value })
                  }
                  placeholder="BG123456789"
                />
              </div>
            </div>

            
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-textPrimary mb-4">Ð£ÑÐ»Ð¾Ð²Ð¸Ñ Ð¸ Ð±ÐµÐ»ÐµÐ¶ÐºÐ¸</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    Ð£ÑÐ»Ð¾Ð²Ð¸Ñ Ð·Ð° Ð´Ð¾ÑÑ‚Ð°Ð²ÐºÐ°
                  </label>
                  <textarea
                    value={formData.deliveryNotes}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData({ ...formData, deliveryNotes: e.target.value })
                    }
                    className="w-full px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={3}
                    placeholder="Ð”Ð¾ÑÑ‚Ð°Ð²ÐºÐ° Ð² ÑÑŠÑ‰Ð¸Ñ Ð´ÐµÐ½, Ð¼Ð¸Ð½Ð¸Ð¼Ð°Ð»Ð½Ð° Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ° 50 â‚¬..."
                    aria-label="Ð£ÑÐ»Ð¾Ð²Ð¸Ñ Ð·Ð° Ð´Ð¾ÑÑ‚Ð°Ð²ÐºÐ°"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    Ð’ÑŠÑ‚Ñ€ÐµÑˆÐ½Ð¸ Ð±ÐµÐ»ÐµÐ¶ÐºÐ¸
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={3}
                    placeholder="Ð‘ÑŠÑ€Ð·Ð¸, Ð½Ð¾ ÑÐºÑŠÐ¿Ð¸. Ð˜Ð¼Ð°Ñ‚ Ð¾Ñ‚ÑÑ‚ÑŠÐ¿ÐºÐ° 10%..."
                    aria-label="Ð’ÑŠÑ‚Ñ€ÐµÑˆÐ½Ð¸ Ð±ÐµÐ»ÐµÐ¶ÐºÐ¸"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="isActive" className="text-sm text-textPrimary cursor-pointer">
                    ÐÐºÑ‚Ð¸Ð²ÐµÐ½
                  </label>
                </div>

                <div className="flex items-center gap-2">
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
                    ÐŸÑ€ÐµÐ´Ð¿Ð¾Ñ‡Ð¸Ñ‚Ð°Ð½ Ð´Ð¾ÑÑ‚Ð°Ð²Ñ‡Ð¸Ðº
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => navigate(`/admin/suppliers/${id}`)} className="w-full sm:w-auto">
              ÐžÑ‚ÐºÐ°Ð·
            </Button>
            <Button type="submit" isLoading={isSaving} className="w-full sm:w-auto">
              Ð—Ð°Ð¿Ð°Ð·Ð¸ Ð¿Ñ€Ð¾Ð¼ÐµÐ½Ð¸
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default SupplierEdit;


