import { useNavigate } from 'react-router-dom';

const ServiceRoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-mainBg flex items-center justify-center px-6">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-5xl font-bold text-textPrimary mb-4">
            Auto<span className="text-primary">Manager</span>
          </h1>
          <p className="text-lg text-textSecondary max-w-xl mx-auto">
            Изберете ролята, с която ще влезете в системата на сервиза.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Admin */}
          <button
            onClick={() => navigate('/login?role=admin')}
            className="group bg-cardBg border border-borderSubtle rounded-2xl p-10 text-left shadow-card transition-all hover:border-primary hover:shadow-lg focus:outline-none"
          >
            <div className="flex items-start gap-5">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary-50 text-primary">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-3-3v6m8-1a2 2 0 01-2 2H6a2 2 0 01-2-2V7l6-4 6 4v7z"
                  />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-textPrimary mb-2">
                  Администратор
                </h2>
                <p className="text-textSecondary leading-relaxed">
                  Достъп до управление на сервиза, потребители, ремонти,
                  автомобили и системни настройки.
                </p>

                <span className="inline-block mt-4 text-primary font-medium group-hover:underline">
                  Вход →
                </span>
              </div>
            </div>
          </button>

          {/* Mechanic */}
          <button
            onClick={() => navigate('/login?role=mechanic')}
            className="group bg-cardBg border border-borderSubtle rounded-2xl p-10 text-left shadow-card transition-all hover:border-primary hover:shadow-lg focus:outline-none"
          >
            <div className="flex items-start gap-5">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary-50 text-primary">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.7 6.3a1 1 0 010 1.4l-1.4 1.4a1 1 0 01-1.4 0L9.3 7.7a1 1 0 010-1.4l1.4-1.4a1 1 0 011.4 0l2.6 2.6zM7 21h10a2 2 0 002-2v-7l-5-5H7a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-textPrimary mb-2">
                  Механик
                </h2>
                <p className="text-textSecondary leading-relaxed">
                  Достъп до възложени задачи, ремонти, сервизна история
                  и техническа информация.
                </p>

                <span className="inline-block mt-4 text-primary font-medium group-hover:underline">
                  Вход →
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Back */}
        <div className="text-center mt-14">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-textMuted hover:text-textSecondary hover:underline transition-colors"
          >
            ← Назад
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceRoleSelection;
