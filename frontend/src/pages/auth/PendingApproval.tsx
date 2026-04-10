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
      ? 'механик'
      : role === 'client'
        ? 'клиент'
        : 'потребител';

  const fallbackMessage = serviceCompanyName
    ? `Профилът ви като ${roleLabel} за сервиз "${serviceCompanyName}" е създаден, но все още чака одобрение от администратор.`
    : `Профилът ви като ${roleLabel} е създаден, но все още чака одобрение от администратор.`;

  return (
    <div className="min-h-screen bg-mainBg flex">
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar text-white p-12 flex-col justify-center shadow-sidebar">
        <h1 className="text-5xl font-bold mb-6">
          Auto<span className="text-primary">Manager</span>
        </h1>
        <h2 className="text-2xl sm:text-3xl font-semibold mb-4">Профилът чака одобрение</h2>
        <p className="text-xl text-gray-300 leading-relaxed">
          След одобрение от сервиза ще получите имейл и ще можете да влезете успешно.
        </p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="max-w-md w-full bg-cardBg rounded-2xl shadow-card p-6 sm:p-8">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Clock3 className="w-7 h-7 text-primary" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-textPrimary text-center mb-3">
            Изчаква одобрение
          </h2>

          <p className="text-textSecondary text-center leading-relaxed">
            {backendMessage || fallbackMessage}
          </p>

          {email && (
            <p className="text-sm text-textMuted text-center mt-4 break-all">
              Регистриран имейл: <span className="text-textSecondary">{email}</span>
            </p>
          )}

          <div className="mt-8 text-center space-y-2">
            <a
              href={role ? `/login?role=${encodeURIComponent(role)}` : '/login'}
              className="text-sm text-primary hover:text-primary-700 hover:underline block transition-colors"
            >
              Опитай вход отново
            </a>
            <a
              href="/"
              className="text-sm text-textMuted hover:text-textSecondary hover:underline block transition-colors"
            >
              Назад към началото
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;

