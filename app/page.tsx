'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FiTrendingUp, FiDollarSign, FiTarget, FiZap, FiLock, FiActivity, FiBarChart2, FiArrowUpRight } from 'react-icons/fi';

interface UserBalance {
  id: number;
  user_id: number;
  balance_type: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const [isAuth, setIsAuth] = useState(false)
  const [user, setUser] = useState<{ id: number; username: string; email: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [balance, setBalance] = useState<UserBalance[]>([])


  useEffect(() => {
    const checkAuth = async () => {
      const response = await fetch('/api/auth');
      const data = await response.json();
      setIsAuth(data.isAuthenticated);
      if (data.isAuthenticated && data.user) {
        setUser(data.user);
      }
      setIsLoading(false)
    }
    checkAuth();
  }, [])

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const response = await fetch('/api/balance')
        const data = await response.json()
        if (data.balance) {
          setBalance(data.balance)
        }
      } catch (error) {
        console.error('Ошибка загрузки баланса:', error)
      }
    }
    loadBalance()
  }, [])

  const betsBalance = balance.find(b => b.balance_type === 'bets')?.amount || 0;
  const cryptoBalance = balance.find(b => b.balance_type === 'crypto')?.amount || 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-full min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <>
      {isAuth ? (
        <>
          <div className="flex flex-col justify-center items-center w-full space-y-8 mt-[40px] mb-[20px]">
            <h1 className="text-3xl font-bold text-center mb-[60px]">Welcome back, {user?.username || 'Boss'}</h1>
            <section className="flex justify-start items-center flex-col w-full min-h-[500px] bg-[var(--background-second)] backdrop-blur-[7px] rounded-[30px] p-5 md:p-8">
              <header className="mb-6">
                <h2 className="text-3xl font-bold text-center">Ставки</h2>
              </header>
              <main className="w-full h-full bg-[var(--secondary)] rounded-[20px] flex flex-col md:flex-row justify-center items-center gap-5 p-5 md:p-8">
                <aside className="w-full md:w-[30%] h-auto bg-[var(--primary)] rounded-xl p-5 flex flex-col gap-3">
                  <h3 className="text-lg font-semibold mb-2">Баланс</h3>
                  <p className="text-3xl font-bold text-green-400">{betsBalance}$</p>
                  <div className="space-y-2 text-sm mt-4">
                    <p className="flex justify-between">
                      <span>24h:</span>
                      <span className="text-[var(--text-secondary)]">--%</span>
                    </p>
                    <p className="flex justify-between">
                      <span>7d:</span>
                      <span className="text-[var(--text-secondary)]">--%</span>
                    </p>
                    <p className="flex justify-between">
                      <span>1m:</span>
                      <span className="text-[var(--text-secondary)]">--%</span>
                    </p>
                  </div>
                </aside>
                <article className="w-full flex-1 bg-[var(--primary)] rounded-xl p-5 md:p-8">
                  <h3 className="text-xl font-semibold mb-4">Последние ставки</h3>
                  <div className="text-center py-12 text-[var(--text-secondary)]">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <FiBarChart2 className="text-2xl" />
                      <p className="text-lg">Таблица ставок</p>
                    </div>
                    <p className="text-sm">Ваши ставки будут отображаться здесь</p>
                  </div>
                  <div className="mt-6 text-center text-[var(--text-secondary)]">
                    <div className="flex items-center justify-center gap-2">
                      <FiTrendingUp className="text-xl" />
                      <p>График прибыли</p>
                    </div>
                  </div>
                </article>
              </main>
            </section>

            <section className="flex justify-start items-center flex-col w-full min-h-[500px] bg-[var(--background-second)] backdrop-blur-[7px] rounded-[30px] p-5 md:p-8">
              <header className="mb-6">
                <h2 className="text-3xl font-bold text-center">Крипто-трейдинг</h2>
              </header>
              <main className="w-full h-full bg-[var(--secondary)] rounded-[20px] flex flex-col md:flex-row justify-center items-center gap-5 p-5 md:p-8">
                <aside className="w-full md:w-[30%] h-auto bg-[var(--primary)] rounded-xl p-5 flex flex-col gap-3">
                  <h3 className="text-lg font-semibold mb-2">Баланс</h3>
                  <p className="text-3xl font-bold text-green-400">{cryptoBalance}$</p>
                  <div className="space-y-2 text-sm mt-4">
                    <p className="flex justify-between">
                      <span>24h:</span>
                      <span className="text-[var(--text-secondary)]">--%</span>
                    </p>
                    <p className="flex justify-between">
                      <span>7d:</span>
                      <span className="text-[var(--text-secondary)]">--%</span>
                    </p>
                    <p className="flex justify-between">
                      <span>1m:</span>
                      <span className="text-[var(--text-secondary)]">--%</span>
                    </p>
                  </div>
                </aside>
                <article className="w-full flex-1 bg-[var(--primary)] rounded-xl p-5 md:p-8">
                  <h3 className="text-xl font-semibold mb-4">Последние сделки</h3>
                  <div className="text-center py-12 text-[var(--text-secondary)]">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <FiBarChart2 className="text-2xl" />
                      <p className="text-lg">Таблица сделок</p>
                    </div>
                    <p className="text-sm">Ваши сделки будут отображаться здесь</p>
                  </div>
                  <div className="mt-6 text-center text-[var(--text-secondary)]">
                    <div className="flex items-center justify-center gap-2">
                      <FiTrendingUp className="text-xl" />
                      <p>График капитализации</p>
                    </div>
                  </div>
                </article>
              </main>
            </section>
          </div>
        </>
      ) : (
        <div className="w-full space-y-8 mb-[20px]">
          <section className="text-center py-16 px-5">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
              Cash Flipper
            </h1>
            <p className="text-xl md:text-2xl text-[var(--text-secondary)] mb-2 max-w-2xl mx-auto">
              Ваш персональный помощник для управления ставками и криптовалютой
            </p>
            <p className="text-lg text-[var(--text-secondary)] mb-8 max-w-xl mx-auto">
              Отслеживайте прибыль, анализируйте статистику и контролируйте свои финансы в одном месте
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/registration"
                className="px-8 py-4 rounded-xl bg-[var(--primary)] text-white font-semibold hover:bg-[var(--primary)]/90 transition-all transform hover:scale-105"
              >
                Начать бесплатно
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 rounded-xl border-2 border-[var(--primary)] text-[var(--primary)] font-semibold hover:bg-[var(--primary)] hover:text-white transition-all"
              >
                Войти
              </Link>
            </div>
          </section>

          <section className="w-full bg-[var(--background-second)] backdrop-blur-[7px] rounded-[30px] p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Что такое Cash Flipper?</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-[var(--secondary)] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <FiTrendingUp className="text-2xl text-[var(--text)]" />
                  <h3 className="text-xl font-semibold text-[var(--text)]">Аналитика в реальном времени</h3>
                </div>
                <p className="text-[var(--text-secondary)]">
                  Отслеживайте свою прибыль за 24 часа, 7 дней и месяц. Визуализируйте успехи и находите точки роста.
                </p>
              </div>
              <div className="bg-[var(--secondary)] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <FiDollarSign className="text-2xl text-[var(--text)]" />
                  <h3 className="text-xl font-semibold text-[var(--text)]">Виртуальный баланс</h3>
                </div>
                <p className="text-[var(--text-secondary)]">
                  Раздельные балансы для ставок и криптовалюты. Полный контроль над виртуальными финансами без рисков.
                </p>
              </div>
              <div className="bg-[var(--secondary)] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <FiTarget className="text-2xl text-[var(--text)]" />
                  <h3 className="text-xl font-semibold text-[var(--text)]">Учет ставок</h3>
                </div>
                <p className="text-[var(--text-secondary)]">
                  Записывайте каждую ставку, отслеживайте результаты и анализируйте эффективность ваших решений.
                </p>
              </div>
              <div className="bg-[var(--secondary)] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <FiArrowUpRight className="text-2xl text-[var(--text)]" />
                  <h3 className="text-xl font-semibold text-[var(--text)]">Крипто-трейдинг</h3>
                </div>
                <p className="text-[var(--text-secondary)]">
                  Фиксируйте сделки, отслеживайте контракты и рыночную капитализацию. Все в одном месте.
                </p>
              </div>
            </div>
          </section>

          <section className="w-full bg-[var(--background-second)] backdrop-blur-[7px] rounded-[30px] p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Почему выбирают нас?</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <FiZap className="text-5xl text-[var(--primary)]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Быстро</h3>
                <p className="text-[var(--text-secondary)]">Мгновенный доступ к вашей статистике и балансам</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <FiLock className="text-5xl text-[var(--primary)]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Безопасно</h3>
                <p className="text-[var(--text-secondary)]">Ваши данные под надежной защитой</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <FiActivity className="text-5xl text-[var(--primary)]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Эффективно</h3>
                <p className="text-[var(--text-secondary)]">Улучшайте свои результаты с помощью аналитики</p>
              </div>
            </div>
          </section>

          <section className="w-full bg-[var(--background-second)] backdrop-blur-[7px] rounded-[30px] p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Как это работает?</h2>
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center font-bold text-xl">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Зарегистрируйтесь</h3>
                  <p className="text-[var(--text-secondary)]">
                    Создайте аккаунт за минуту. Никаких сложных настроек, просто начните использовать сервис.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center font-bold text-xl">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Добавьте свои данные</h3>
                  <p className="text-[var(--text-secondary)]">
                    Вносите ставки и сделки вручную. Полный контроль над информацией.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center font-bold text-xl">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Анализируйте результаты</h3>
                  <p className="text-[var(--text-secondary)]">
                    Просматривайте статистику, графики и отчеты. Улучшайте свои стратегии на основе данных.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
