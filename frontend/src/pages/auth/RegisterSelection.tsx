import { Link } from 'react-router-dom';
import { ArrowRight, Building2, User } from 'lucide-react';

const RegisterSelection = () => {
  return (
    <div className="min-h-screen bg-mainBg flex items-center justify-center px-4 sm:px-6 py-8 sm:py-10">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-10 sm:mb-14">
          <h1 className="text-4xl sm:text-5xl font-bold text-textPrimary mb-4">
            Auto<span className="text-primary">Manager</span>
          </h1>
          <p className="text-base sm:text-lg text-textSecondary max-w-2xl mx-auto">
            Изберете как искате да се регистрирате.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
          <Link
            to="/register-client"
            className="group bg-cardBg border border-borderSubtle rounded-2xl p-6 sm:p-10 text-left shadow-card transition-all hover:border-primary hover:shadow-lg"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-textPrimary mb-2 whitespace-nowrap">
              Регистрация като клиент
            </h2>
            <p className="text-textSecondary leading-relaxed">
              Създавате клиентски профил за проследяване на поръчки, фактури и известия.
            </p>
            <span className="inline-flex items-center gap-1 mt-4 text-primary font-medium group-hover:underline whitespace-nowrap">
              Продължи <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            to="/auth/service-role?mode=register"
            className="group bg-cardBg border border-borderSubtle rounded-2xl p-6 sm:p-10 text-left shadow-card transition-all hover:border-primary hover:shadow-lg"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-textPrimary mb-2 whitespace-nowrap">
              Регистрация като сервиз
            </h2>
            <p className="text-textSecondary leading-relaxed">
              Избирате роля в сервиза (администратор или механик) и продължавате към формата.
            </p>
            <span className="inline-flex items-center gap-1 mt-4 text-primary font-medium group-hover:underline whitespace-nowrap">
              Продължи <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        <div className="text-center mt-10 sm:mt-14">
          <Link
            to="/"
            className="text-sm text-textMuted hover:text-textSecondary hover:underline transition-colors"
          >
            ← Назад към началото
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterSelection;
