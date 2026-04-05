import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Car,
  Check,
  ClipboardList,
  FileText,
  LogIn,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  Truck,
  User,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const HERO_IMAGE =
  'https://media.base44.com/images/public/69cf92b061a3e1c15dd38cf7/c324932a0_generated_image.png';

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: BarChart3,
    title: 'Табло в реално време',
    description:
      'Поръчки, активни задачи, приходи и разходи на едно място с актуални данни.',
  },
  {
    icon: BarChart3,
    title: 'Финансови справки',
    description:
      'Следете приходи и разходи по периоди, както и платени и неплатени поръчки.',
  },
  {
    icon: FileText,
    title: 'Фактуриране',
    description:
      'Пълно фактуриране с проследяване на плащания и PDF фактури директно от системата.',
  },
  {
    icon: CalendarDays,
    title: 'Сервизен календар и график',
    description:
      'Планирате задачите по дни и управлявате работния процес на екипа по-лесно.',
  },
  {
    icon: ClipboardList,
    title: 'Управление на поръчките',
    description:
      'Проследявайте всяка поръчка от приемане до предаване с ясни статуси и история.',
  },
  {
    icon: Users,
    title: 'Клиентска база',
    description:
      'Пълна история за всеки клиент с неговите автомобили, поръчки и контакти.',
  },
  {
    icon: Car,
    title: 'База данни с автомобили',
    description:
      'Всички автомобили и сервизни дейности са подредени и лесни за намиране.',
  },
  {
    icon: Wrench,
    title: 'Управление на механици',
    description:
      'Профили на работниците и ясно разпределение на задачите по екип и график.',
  },
  {
    icon: Truck,
    title: 'Управление на доставчици',
    description:
      'Контактна информация и статус на доставчиците на части и консумативи.',
  },
  {
    icon: Bell,
    title: 'Известия за важни събития',
    description:
      'Клиентите получават известия в системата и по имейл при ключови промени.',
  },
  {
    icon: ShieldCheck,
    title: 'Сигурен достъп до системата',
    description:
      'Ясни потребителски роли и защита на достъпа за администратор, механик и клиент.',
  },
];

const includedInPlan = [
  'Табло със статистики в реално време',
  'Финансов модул с графики и анализ',
  'Пълно фактуриране и PDF фактури',
  'Управление на доставчици',
  'База данни с клиенти и история',
  'База данни с автомобили и статуси',
  'Управление на работници и профили',
  'Календар и график на задачите',
  'Известия в системата и по имейл',
  'Сигурност с нива на достъп',
];

const howItWorks = [
  {
    title: 'Регистрация на сервиз',
    description:
      'Създайте профил на сервиза и попълнете основните фирмени данни.',
  },
  {
    title: 'Вход и първоначална настройка',
    description:
      'Влезте в профила и настройте екипа, услугите и основните работни процеси.',
  },
  {
    title: 'Добавяне на екип и клиенти',
    description:
      'Добавяйте механици и клиенти, разпределяйте задачи и организирайте графика.',
  },
  {
    title: 'Започвате работа',
    description:
      'Управлявате поръчки, фактури и финанси от едно централизирано място.',
  },
];

const sectionLinkClass =
  'px-3 py-2 text-sm font-medium text-textSecondary hover:text-textPrimary transition-colors rounded-lg';

const LandingPage = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-mainBg text-textPrimary">
      <nav className="sticky top-0 z-50 bg-cardBg border-b border-borderSubtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <a href="#hero" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                Auto<span className="text-primary">Manager</span>
              </span>
            </a>

            <div className="hidden md:flex items-center gap-1">
              <a href="#features" className={sectionLinkClass}>
                Функции
              </a>
              <a href="#how-it-works" className={sectionLinkClass}>
                Как работи
              </a>
              <a href="#pricing" className={sectionLinkClass}>
                Абонамент
              </a>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-textSecondary hover:text-textPrimary hover:bg-mainBg transition-colors"
                aria-label={theme === 'dark' ? 'Светла тема' : 'Тъмна тема'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>

              <Link
                to="/login?role=client"
                className="px-4 h-9 inline-flex items-center rounded-lg border border-borderStrong text-sm font-medium text-textPrimary hover:bg-mainBg transition-colors whitespace-nowrap"
              >
                Вход за клиент
              </Link>
              <Link
                to="/auth/service-role?mode=login"
                className="px-4 h-9 inline-flex items-center rounded-lg border border-borderStrong text-sm font-medium text-textPrimary hover:bg-mainBg transition-colors whitespace-nowrap"
              >
                Вход за сервиз
              </Link>
              <Link
                to="/register"
                className="px-4 h-9 inline-flex items-center rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-700 transition-colors whitespace-nowrap"
              >
                Регистрация
              </Link>
            </div>

            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-textSecondary hover:text-textPrimary hover:bg-mainBg transition-colors"
                aria-label={theme === 'dark' ? 'Светла тема' : 'Тъмна тема'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setMobileOpen((prev) => !prev)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-textSecondary hover:text-textPrimary hover:bg-mainBg transition-colors"
                aria-label="Меню"
              >
                {mobileOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-borderSubtle bg-cardBg">
            <div className="px-4 py-4 space-y-2">
              <a
                href="#features"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-textSecondary hover:text-textPrimary hover:bg-mainBg rounded-lg transition-colors"
              >
                Функции
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-textSecondary hover:text-textPrimary hover:bg-mainBg rounded-lg transition-colors"
              >
                Как работи
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-textSecondary hover:text-textPrimary hover:bg-mainBg rounded-lg transition-colors"
              >
                Абонамент
              </a>
              <div className="pt-3 border-t border-borderSubtle grid gap-2">
                <Link
                  to="/login?role=client"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 h-10 inline-flex items-center justify-center rounded-lg border border-borderStrong text-sm font-medium text-textPrimary hover:bg-mainBg transition-colors whitespace-nowrap"
                >
                  Вход за клиент
                </Link>
                <Link
                  to="/auth/service-role?mode=login"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 h-10 inline-flex items-center justify-center rounded-lg border border-borderStrong text-sm font-medium text-textPrimary hover:bg-mainBg transition-colors whitespace-nowrap"
                >
                  Вход за сервиз
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 h-10 inline-flex items-center justify-center rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-700 transition-colors whitespace-nowrap"
                >
                  Регистрация
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main>
        <section id="hero" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-16 sm:pb-20">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
                  Управлявайте сервиза си{' '}
                  <span className="text-primary">дигитално</span>
                </h1>
                <p className="mt-5 text-base sm:text-lg text-textSecondary leading-relaxed max-w-xl">
                  Край на тетрадките и хаоса. С AutoManager управлявате целия
                  сервиз дигитално: клиенти, автомобили, поръчки, фактури,
                  финанси и доставчици.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/register"
                    className="w-full sm:w-auto px-6 h-12 inline-flex items-center justify-center rounded-lg bg-primary text-white font-semibold hover:bg-primary-700 transition-colors whitespace-nowrap"
                  >
                    Регистрация на сервиз
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                  <Link
                    to="/auth/service-role?mode=login"
                    className="w-full sm:w-auto px-6 h-12 inline-flex items-center justify-center rounded-lg border border-borderStrong text-textPrimary font-semibold hover:bg-mainBg transition-colors whitespace-nowrap"
                  >
                    Вход за сервиз
                  </Link>
                  <Link
                    to="/login?role=client"
                    className="w-full sm:w-auto px-6 h-12 inline-flex items-center justify-center rounded-lg border border-borderStrong text-textPrimary font-semibold hover:bg-mainBg transition-colors whitespace-nowrap"
                  >
                    Вход за клиент
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden border border-borderSubtle shadow-card">
                  <img
                    src={HERO_IMAGE}
                    alt="AutoManager - управление на автосервиз"
                    className="w-full h-auto"
                    loading="eager"
                  />
                </div>
                <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/15 rounded-full blur-3xl" />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                Всичко, от което се нуждае вашият сервиз
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="bg-cardBg rounded-2xl border border-borderSubtle p-6 shadow-card hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-textSecondary leading-relaxed">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-16 sm:py-20 bg-cardBg border-y border-borderSubtle">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary mb-3">
                Процес
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                Започнете работа още днес
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {howItWorks.map((step, index) => (
                <article
                  key={step.title}
                  className="rounded-2xl border border-borderSubtle p-6 bg-mainBg shadow-card"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center mb-4">
                    {index + 1}
                  </div>
                  <h3 className="text-base font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-textSecondary leading-relaxed">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary mb-3">
                Абонамент
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                Един план. Всичко включено.
              </h2>
            </div>

            <div className="max-w-xl mx-auto bg-cardBg rounded-2xl border-2 border-primary/20 shadow-card p-7 sm:p-9">
              <div className="text-center mb-8">
                <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-3 py-1 mb-4">
                  Професионален план
                </span>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl sm:text-5xl font-extrabold">40</span>
                  <span className="text-lg font-medium text-textSecondary">€/мес</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {includedInPlan.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className="w-full h-12 inline-flex items-center justify-center rounded-lg bg-primary text-white font-semibold hover:bg-primary-700 transition-colors"
              >
                Регистрация на сервиз
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </section>

        <section id="auth-actions" className="py-16 sm:py-20 bg-cardBg border-t border-borderSubtle">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                Готови ли сте да дигитализирате сервиза си?
              </h2>
              <p className="mt-4 text-textSecondary">
                Изберете как искате да продължите.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <Link
                to="/login?role=client"
                className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-mainBg border border-borderSubtle shadow-card hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-semibold whitespace-nowrap">Вход за клиент</p>
              </Link>

              <Link
                to="/auth/service-role?mode=login"
                className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-mainBg border border-borderSubtle shadow-card hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <LogIn className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-semibold whitespace-nowrap">Вход за сервиз</p>
              </Link>

              <Link
                to="/register"
                className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-primary text-white shadow-card hover:bg-primary-700 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <ArrowRight className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold whitespace-nowrap">Регистрация</p>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-borderSubtle bg-mainBg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold">
              Auto<span className="text-primary">Manager</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-textMuted text-center">
            AutoManager - дигитално управление на автосервизи
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
