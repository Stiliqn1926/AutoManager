import { useState, useEffect, useCallback } from 'react';
import { useServiceCompany } from '../../hooks/useServiceCompany';
import { FileText, Download, Check, X, Calendar, DollarSign, Car } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: string;
  issueDate: string;
  dueDate: string | null;
  isPaid: boolean;
  paidDate: string | null;
  order: {
    id: string;
    orderNumber: string;
    description: string;
    vehicle: {
      brand: string;
      model: string;
      licensePlate: string;
    };
  };
}

const Invoices = () => {
  const { selectedServiceCompany } = useServiceCompany();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  const fetchInvoices = useCallback(async () => {
    if (!selectedServiceCompany) {
      setInvoices([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get('/client/invoices', {
        params: { serviceCompanyId: selectedServiceCompany.id },
      });
      setInvoices(response.data.invoices || []);
    } catch (error) {
      toast.error('Грешка при зареждане на фактури');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedServiceCompany]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDownload = async (invoiceNumber: string) => {
    try {
      const response = await api.get(`/invoices/${invoiceNumber}/pdf`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Фактурата е изтеглена');
    } catch (error) {
      toast.error('Грешка при изтегляне на фактура');
      console.error(error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('bg-BG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatMoney = (value: string) => {
    return `${Number(value).toFixed(2)} лв.`;
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (filter === 'paid') return inv.isPaid;
    if (filter === 'unpaid') return !inv.isPaid;
    return true;
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!selectedServiceCompany) {
    return (
      <MainLayout>
        <div className="bg-cardBg rounded-2xl shadow-card p-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-textPrimary mb-2">Няма избран сервиз</h2>
          <p className="text-textSecondary">Избери сервиз, за да видиш фактурите си.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-textPrimary">Фактури</h1>
          <p className="text-textSecondary mt-1">
            Всички фактури от {selectedServiceCompany.name}
          </p>
        </div>

       {/* Stats */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div className="bg-cardBg rounded-2xl shadow-card p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-textSecondary">Всичко</p>
        <p className="text-3xl font-bold text-textPrimary mt-1">{invoices.length}</p>
      </div>
      <div className="p-3 bg-gray-100 rounded-lg border border-borderSubtle">
        <FileText className="w-6 h-6 text-primary" />
      </div>
    </div>
  </div>

  <div className="bg-cardBg rounded-2xl shadow-card p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-textSecondary">Платени</p>
        <p className="text-3xl font-bold text-textPrimary mt-1">
          {invoices.filter((i) => i.isPaid).length}
        </p>
      </div>
      <div className="p-3 bg-gray-100 rounded-lg border border-borderSubtle">
        <Check className="w-6 h-6 text-primary" />
      </div>
    </div>
  </div>

  <div className="bg-cardBg rounded-2xl shadow-card p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-textSecondary">Неплатени</p>
        <p className="text-3xl font-bold text-textPrimary mt-1">
          {invoices.filter((i) => !i.isPaid).length}
        </p>
      </div>
      <div className="p-3 bg-gray-100 rounded-lg border border-borderSubtle">
        <X className="w-6 h-6 text-primary" />
      </div>
    </div>
  </div>
</div>

        {/* Filters */}
        <div className="bg-cardBg rounded-2xl shadow-card p-6">
          <div className="flex gap-2 mb-6">
            {[
              { key: 'all', label: 'Всички' },
              { key: 'unpaid', label: 'Неплатени' },
              { key: 'paid', label: 'Платени' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as typeof filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-textSecondary hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Invoices List */}
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-textPrimary mb-2">Няма фактури</h3>
              <p className="text-textSecondary">Все още няма {filter === 'paid' ? 'платени' : filter === 'unpaid' ? 'неплатени' : ''} фактури</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="p-4 border border-borderSubtle rounded-lg hover:bg-mainBg transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-textPrimary">
                          {invoice.invoiceNumber}
                        </span>
                        {invoice.isPaid ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Платена
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Неплатена
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <Car className="w-4 h-4 text-textMuted" />
                        <span className="text-sm text-textPrimary">
                          {invoice.order.vehicle.brand} {invoice.order.vehicle.model}
                        </span>
                        <span className="text-sm text-textMuted">
                          ({invoice.order.vehicle.licensePlate})
                        </span>
                      </div>

                      <p className="text-sm text-textSecondary line-clamp-1">
                        {invoice.order.description}
                      </p>

                      <div className="flex items-center gap-4 mt-3 text-sm text-textMuted">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(invoice.issueDate)}
                        </div>

                        {invoice.isPaid && invoice.paidDate && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Check className="w-4 h-4" />
                            Платена: {formatDate(invoice.paidDate)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-textMuted text-xs mb-1">
                          <DollarSign className="w-4 h-4" />
                          Обща сума
                        </div>
                        <div className="font-semibold text-lg text-textPrimary">
                          {formatMoney(invoice.totalAmount)}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownload(invoice.invoiceNumber)}
                        className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                        title="Изтегли PDF"
                      >
                        <Download className="w-5 h-5 text-primary" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Invoices;