import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Settings, Wrench } from 'lucide-react';

const RoleSelection = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const isRegisterMode = mode === 'register';

  const adminLink = isRegisterMode ? '/register-admin' : '/login?role=admin';
  const mechanicLink = isRegisterMode ? '/register-mechanic' : '/login?role=mechanic';
  const backLink = '/';

  return (
    <div className="min-h-screen bg-mainBg flex items-center justify-center px-4 sm:px-6 py-8 sm:py-10">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-10 sm:mb-14">
          <h1 className="text-4xl sm:text-5xl font-bold text-textPrimary mb-4">
            Auto<span className="text-primary">Manager</span>
          </h1>
          <p className="text-base sm:text-lg text-textSecondary max-w-2xl mx-auto">
            {isRegisterMode
              ? 'Изберете роля за регистрация в сервиза.'
              : 'Изберете роля за вход в сервиза.'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
          <Link
            to={adminLink}
            className="group bg-cardBg border border-borderSubtle rounded-2xl p-6 sm:p-10 text-left shadow-card transition-all hover:border-primary hover:shadow-lg"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-textPrimary mb-2 whitespace-nowrap">
              Администратор
            </h2>
            <p className="text-textSecondary leading-relaxed">
              Пълен достъп до управление на сервиза, екипа, поръчките и настройките.
            </p>
            <span className="inline-flex items-center gap-1 mt-4 text-primary font-medium group-hover:underline whitespace-nowrap">
              {isRegisterMode ? 'Регистрация' : 'Вход'} <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            to={mechanicLink}
            className="group bg-cardBg border border-borderSubtle rounded-2xl p-6 sm:p-10 text-left shadow-card transition-all hover:border-primary hover:shadow-lg"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-textPrimary mb-2 whitespace-nowrap">
              Механик
            </h2>
            <p className="text-textSecondary leading-relaxed">
              Достъп до възложени задачи, график и активни поръчки в сервиза.
            </p>
            <span className="inline-flex items-center gap-1 mt-4 text-primary font-medium group-hover:underline whitespace-nowrap">
              {isRegisterMode ? 'Регистрация' : 'Вход'} <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        <div className="text-center mt-10 sm:mt-14">
          <Link
            to={backLink}
            className="text-sm text-textMuted hover:text-textSecondary hover:underline transition-colors"
          >
            ← Назад
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;

