import { useSearchParams } from 'react-router-dom';
import { Clock3 } from 'lucide-react';

const PendingApproval = () => {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');
  const email = searchParams.get('email');
  const serviceCompanyName = searchParams.get('serviceCompanyName');
  const backendMessage = searchParams.get('message');

  const roleLabel =
    role === 'mechanic'
      ? 'Ð¼ÐµÑ…Ð°Ð½Ð¸Ðº'
      : role === 'client'
        ? 'ÐºÐ»Ð¸ÐµÐ½Ñ‚'
        : 'Ð¿Ð¾Ñ‚Ñ€ÐµÐ±Ð¸Ñ‚ÐµÐ»';

  const fallbackMessage = serviceCompanyName
    ? `ÐŸÑ€Ð¾Ñ„Ð¸Ð»ÑŠÑ‚ Ð²Ð¸ ÐºÐ°Ñ‚Ð¾ ${roleLabel} Ð·Ð° ÑÐµÑ€Ð²Ð¸Ð· "${serviceCompanyName}" Ðµ ÑÑŠÐ·Ð´Ð°Ð´ÐµÐ½, Ð½Ð¾ Ð²ÑÐµ Ð¾Ñ‰Ðµ Ñ‡Ð°ÐºÐ° Ð¾Ð´Ð¾Ð±Ñ€ÐµÐ½Ð¸Ðµ Ð¾Ñ‚ Ð°Ð´Ð¼Ð¸Ð½Ð¸ÑÑ‚Ñ€Ð°Ñ‚Ð¾Ñ€.`
    : `ÐŸÑ€Ð¾Ñ„Ð¸Ð»ÑŠÑ‚ Ð²Ð¸ ÐºÐ°Ñ‚Ð¾ ${roleLabel} Ðµ ÑÑŠÐ·Ð´Ð°Ð´ÐµÐ½, Ð½Ð¾ Ð²ÑÐµ Ð¾Ñ‰Ðµ Ñ‡Ð°ÐºÐ° Ð¾Ð´Ð¾Ð±Ñ€ÐµÐ½Ð¸Ðµ Ð¾Ñ‚ Ð°Ð´Ð¼Ð¸Ð½Ð¸ÑÑ‚Ñ€Ð°Ñ‚Ð¾Ñ€.`;

  return (
    <div className="min-h-screen bg-mainBg flex">
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar text-white p-12 flex-col justify-center shadow-sidebar">
        <h1 className="text-5xl font-bold mb-6">
          Auto<span className="text-primary">Manager</span>
        </h1>
        <h2 className="text-2xl sm:text-3xl font-semibold mb-4">ÐŸÑ€Ð¾Ñ„Ð¸Ð»ÑŠÑ‚ Ñ‡Ð°ÐºÐ° Ð¾Ð´Ð¾Ð±Ñ€ÐµÐ½Ð¸Ðµ</h2>
        <p className="text-xl text-gray-300 leading-relaxed">
          Ð¡Ð»ÐµÐ´ Ð¾Ð´Ð¾Ð±Ñ€ÐµÐ½Ð¸Ðµ Ð¾Ñ‚ ÑÐµÑ€Ð²Ð¸Ð·Ð° Ñ‰Ðµ Ð¿Ð¾Ð»ÑƒÑ‡Ð¸Ñ‚Ðµ Ð¸Ð¼ÐµÐ¹Ð» Ð¸ Ñ‰Ðµ Ð¼Ð¾Ð¶ÐµÑ‚Ðµ Ð´Ð° Ð²Ð»ÐµÐ·ÐµÑ‚Ðµ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾.
        </p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="max-w-md w-full bg-cardBg rounded-2xl shadow-card p-6 sm:p-8">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Clock3 className="w-7 h-7 text-primary" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-textPrimary text-center mb-3">
            Ð˜Ð·Ñ‡Ð°ÐºÐ²Ð° Ð¾Ð´Ð¾Ð±Ñ€ÐµÐ½Ð¸Ðµ
          </h2>

          <p className="text-textSecondary text-center leading-relaxed">
            {backendMessage || fallbackMessage}
          </p>

          {email && (
            <p className="text-sm text-textMuted text-center mt-4 break-all">
              Ð ÐµÐ³Ð¸ÑÑ‚Ñ€Ð¸Ñ€Ð°Ð½ Ð¸Ð¼ÐµÐ¹Ð»: <span className="text-textSecondary">{email}</span>
            </p>
          )}

          <div className="mt-8 text-center space-y-2">
            <a
              href={role ? `/login?role=${encodeURIComponent(role)}` : '/login'}
              className="text-sm text-primary hover:text-primary-700 hover:underline block transition-colors"
            >
              ÐžÐ¿Ð¸Ñ‚Ð°Ð¹ Ð²Ñ…Ð¾Ð´ Ð¾Ñ‚Ð½Ð¾Ð²Ð¾
            </a>
            <a
              href="/"
              className="text-sm text-textMuted hover:text-textSecondary hover:underline block transition-colors"
            >
              ÐÐ°Ð·Ð°Ð´ ÐºÑŠÐ¼ Ð½Ð°Ñ‡Ð°Ð»Ð¾Ñ‚Ð¾
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;

