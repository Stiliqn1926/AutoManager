import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../components/common/Button';

interface OrderItem {
  id: string;
  type: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface FinalizeOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  orderNumber: string;
  orderItems: OrderItem[];
  totalPrice: number;
  clientEmail: string;
}

const FinalizeOrderModal = ({
  isOpen,
  onClose,
  onConfirm,
  orderNumber,
  orderItems,
  totalPrice,
  clientEmail,
}: FinalizeOrderModalProps) => {
  const [isFinalizing, setIsFinalizing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsFinalizing(true);
    try {
      await onConfirm();
      onClose();
    } catch  {
      // Error handled by parent
    } finally {
      setIsFinalizing(false);
    }
  };

  const getItemTypeBadge = (type: string | null | undefined) => {
    const styles: Record<string, string> = {
      LABOR: 'bg-slate-100 text-slate-700',
      PART: 'bg-slate-100 text-slate-700',
      CONSUMABLE: 'bg-slate-100 text-slate-700',
      OTHER: 'bg-slate-100 text-slate-700',
    };
    const labels: Record<string, string> = {
      LABOR: 'Ð£ÑÐ»ÑƒÐ³Ð°',
      PART: 'Ð§Ð°ÑÑ‚',
      CONSUMABLE: 'ÐšÐ¾Ð½ÑÑƒÐ¼Ð°Ñ‚Ð¸Ð²',
      OTHER: 'Ð”Ñ€ÑƒÐ³Ð¾',
    };
    const displayType = type || 'OTHER';
    const label = labels[displayType] || displayType || 'ÐÐµÐ¸Ð·Ð²ÐµÑÑ‚Ð½Ð¾';
    const style = styles[displayType] || 'bg-slate-100 text-slate-700';
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${style}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-borderSubtle px-4 sm:px-6 py-3 sm:py-4 flex items-start justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-textPrimary">Ð¤Ð¸Ð½Ð°Ð»Ð¸Ð·Ð¸Ñ€Ð°Ð½Ðµ Ð½Ð° Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ°</h2>
            <p className="text-sm text-textSecondary mt-1">ÐŸÐ¾Ñ€ÑŠÑ‡ÐºÐ° {orderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isFinalizing}
            aria-label="Ð—Ð°Ñ‚Ð²Ð¾Ñ€Ð¸"
          >
            <X className="w-5 h-5 text-textSecondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <p className="text-sm text-blue-800">
                <strong>Ð’Ð°Ð¶Ð½Ð¾:</strong> Ð¡Ð»ÐµÐ´ Ð¿Ð¾Ñ‚Ð²ÑŠÑ€Ð¶Ð´ÐµÐ½Ð¸Ðµ Ñ‰Ðµ Ð±ÑŠÐ´Ðµ Ð³ÐµÐ½ÐµÑ€Ð¸Ñ€Ð°Ð½Ð° PDF Ñ„Ð°ÐºÑ‚ÑƒÑ€Ð° Ð¸ Ð¸Ð·Ð¿Ñ€Ð°Ñ‚ÐµÐ½Ð° Ð½Ð° ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð° Ð½Ð° Ð°Ð´Ñ€ÐµÑ: <strong>{clientEmail}</strong>
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-textPrimary mb-3">Ð”ÐµÑ‚Ð°Ð¹Ð»Ð¸ Ð½Ð° Ñ„Ð°ÐºÑ‚ÑƒÑ€Ð°Ñ‚Ð°</h3>
              <div className="border border-borderSubtle rounded-lg overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-mainBg">
                    <tr>
                      <th className="text-left py-2 px-3 sm:py-3 sm:px-4 text-xs sm:text-sm font-semibold text-textPrimary">Ð¢Ð¸Ð¿</th>
                      <th className="text-left py-2 px-3 sm:py-3 sm:px-4 text-xs sm:text-sm font-semibold text-textPrimary">ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸Ðµ</th>
                      <th className="text-right py-2 px-3 sm:py-3 sm:px-4 text-xs sm:text-sm font-semibold text-textPrimary">ÐšÐ¾Ð».</th>
                      <th className="text-right py-2 px-3 sm:py-3 sm:px-4 text-xs sm:text-sm font-semibold text-textPrimary">Ð•Ð´. Ñ†ÐµÐ½Ð°</th>
                      <th className="text-right py-2 px-3 sm:py-3 sm:px-4 text-xs sm:text-sm font-semibold text-textPrimary">ÐžÐ±Ñ‰Ð¾</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item) => (
                      <tr key={item.id} className="border-t border-borderSubtle">
                        <td className="py-2 px-3 sm:py-3 sm:px-4">{getItemTypeBadge(item.type)}</td>
                        <td className="py-2 px-3 sm:py-3 sm:px-4 text-textPrimary">{item.description}</td>
                        <td className="py-2 px-3 sm:py-3 sm:px-4 text-right text-textSecondary whitespace-nowrap">{item.quantity}</td>
                        <td className="py-2 px-3 sm:py-3 sm:px-4 text-right text-textSecondary whitespace-nowrap">{Number(item.unitPrice || 0).toFixed(2)} â‚¬</td>
                        <td className="py-2 px-3 sm:py-3 sm:px-4 text-right font-medium text-textPrimary whitespace-nowrap">
                          {Number(item.totalPrice || 0).toFixed(2)} â‚¬
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-borderSubtle bg-mainBg">
                      <td colSpan={4} className="py-3 px-3 sm:py-4 sm:px-4 text-right font-bold text-textPrimary text-lg">
                        ÐžÐ±Ñ‰Ð° ÑÑƒÐ¼Ð°:
                      </td>
                      <td className="py-3 px-3 sm:py-4 sm:px-4 text-right font-bold text-primary text-xl whitespace-nowrap">
                        {Number(totalPrice || 0).toFixed(2)} â‚¬
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
              <p className="text-sm text-yellow-800">
                <strong>Ð’Ð½Ð¸Ð¼Ð°Ð½Ð¸Ðµ:</strong> Ð¡Ð»ÐµÐ´ Ñ„Ð¸Ð½Ð°Ð»Ð¸Ð·Ð¸Ñ€Ð°Ð½Ðµ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ°Ñ‚Ð° Ñ‰Ðµ Ð±ÑŠÐ´Ðµ Ð¼Ð°Ñ€ÐºÐ¸Ñ€Ð°Ð½Ð° ÐºÐ°Ñ‚Ð¾ "Ð“Ð¾Ñ‚Ð¾Ð²Ð°" Ð¸ Ñ„Ð°ÐºÑ‚ÑƒÑ€Ð°Ñ‚Ð° Ñ‰Ðµ Ð±ÑŠÐ´Ðµ Ð¸Ð·Ð¿Ñ€Ð°Ñ‚ÐµÐ½Ð° Ð½ÐµÐ·Ð°Ð±Ð°Ð²Ð½Ð¾.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-borderSubtle">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isFinalizing}
            >
              ÐžÑ‚ÐºÐ°Ð·
            </Button>
            <Button type="submit" isLoading={isFinalizing} className="w-full sm:w-auto">
              ÐŸÐ¾Ñ‚Ð²ÑŠÑ€Ð´Ð¸ Ð¸ Ð¸Ð·Ð¿Ñ€Ð°Ñ‚Ð¸ Ñ„Ð°ÐºÑ‚ÑƒÑ€Ð°
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FinalizeOrderModal;

