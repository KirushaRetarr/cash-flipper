'use client';

import { useState, useEffect, ReactEventHandler } from 'react';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiBarChart2, FiClock, FiPlus, FiTarget, FiActivity } from 'react-icons/fi';

interface UserBalance {
  id: number;
  user_id: number;
  balance_type: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export default function Bets() {
  const [balance, setBalance] = useState<UserBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [betName, setBetName] = useState('')
  const [betSum, setBetSum] = useState<number | null>(null)
  const [betMultiply, setBetMultiply] = useState<number | null>(null)
  const [betDescription, setBetDescription] = useState('')
  const [erorr, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ betName, betSum, betMultiply, betDescription })
    })

    const data = await response.json();

    if (response.ok) {
      setBetName('');
      setBetSum(null);
      setBetMultiply(null);
      setBetDescription('');
      setError('');
    } else {
      setError(data.message)
    }
  }

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const response = await fetch('/api/balance');
        const data = await response.json();
        if (data.balance) {
          setBalance(data.balance);
        }
      } catch (error) {
        console.error('Ошибка загрузки баланса:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadBalance();
  }, []);

  const betsBalance = balance.find(b => b.balance_type === 'bets')?.amount || 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-full min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center w-full space-y-8 mt-[40px] mb-[20px]">
      <h1 className="text-3xl font-bold text-center mb-[60px]">Ставки</h1>

      {/* Блок с балансом */}
      <section className="w-full bg-[var(--background-second)] backdrop-blur-[7px] rounded-[30px] p-5 md:p-8">
        <div className="bg-[var(--secondary)] rounded-[20px] p-5 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <FiDollarSign className="text-2xl text-[var(--primary)]" />
            <h2 className="text-2xl font-bold">Баланс</h2>
          </div>
          <div className="bg-[var(--primary)] rounded-xl p-6">
            <p className="text-sm text-[var(--text-secondary)] mb-2">Текущий баланс</p>
            <p className="text-4xl font-bold text-green-400">{betsBalance}$</p>
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[var(--background-second)]">
              <div>
                <p className="text-xs text-[var(--text-secondary)] mb-1">24ч</p>
                <p className="text-lg font-semibold">--%</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)] mb-1">7д</p>
                <p className="text-lg font-semibold">--%</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)] mb-1">1м</p>
                <p className="text-lg font-semibold">--%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Блок со статистикой */}
      <section className="w-full bg-[var(--background-second)] backdrop-blur-[7px] rounded-[30px] p-5 md:p-8">
        <div className="bg-[var(--secondary)] rounded-[20px] p-5 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <FiBarChart2 className="text-2xl text-[var(--primary)]" />
            <h2 className="text-2xl font-bold">Статистика</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[var(--primary)] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <FiTrendingUp className="text-green-400" />
                <p className="text-sm text-[var(--text-secondary)]">Выигрыши</p>
              </div>
              <p className="text-2xl font-bold">--</p>
            </div>
            <div className="bg-[var(--primary)] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <FiTrendingDown className="text-red-400" />
                <p className="text-sm text-[var(--text-secondary)]">Проигрыши</p>
              </div>
              <p className="text-2xl font-bold">--</p>
            </div>
            <div className="bg-[var(--primary)] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <FiTarget className="text-[var(--primary)]" />
                <p className="text-sm text-[var(--text-secondary)]">Всего ставок</p>
              </div>
              <p className="text-2xl font-bold">--</p>
            </div>
            <div className="bg-[var(--primary)] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <FiActivity className="text-yellow-400" />
                <p className="text-sm text-[var(--text-secondary)]">Процент успеха</p>
              </div>
              <p className="text-2xl font-bold">--%</p>
            </div>
          </div>
        </div>
      </section>

      {/* Блок добавления ставки */}
      <section className="w-full bg-[var(--background-second)] backdrop-blur-[7px] rounded-[30px] p-5 md:p-8">
        <div className="bg-[var(--secondary)] rounded-[20px] p-5 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <FiPlus className="text-2xl text-[var(--primary)]" />
            <h2 className="text-2xl font-bold">Добавить ставку</h2>
          </div>
          <div className="bg-[var(--primary)] rounded-xl p-5 md:p-8">
            {erorr && (
              <div className="mb-4 p-4 rounded-lg bg-red-500/20 text-red-400 border border-red-500/50">
                <p className="text-lg">{erorr}</p>    
              </div>
            )}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-semibold mb-2">Название ставки</label>
                <input
                  type="text"
                  value={betName}
                  onChange={(e) => setBetName(e.target.value)}
                  placeholder="Введите название ставки"
                  className="w-full px-4 py-3 rounded-lg bg-[var(--background-second)] border border-[var(--background-second)] focus:border-[var(--primary)] focus:outline-none text-[var(--text)]"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Сумма ставки</label>
                  <input
                    type="number"
                    value={betSum ?? ''}
                    onChange={(e) => setBetSum(e.target.valueAsNumber)}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-lg bg-[var(--background-second)] border border-[var(--background-second)] focus:border-[var(--primary)] focus:outline-none text-[var(--text)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Коэффициент</label>
                  <input
                    type="number"
                    value={betMultiply ?? ''}
                    onChange={(e) => setBetMultiply(e.target.valueAsNumber)}
                    placeholder="1.00"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-lg bg-[var(--background-second)] border border-[var(--background-second)] focus:border-[var(--primary)] focus:outline-none text-[var(--text)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Описание</label>
                <textarea
                  value={betDescription}
                  onChange={(e) => setBetDescription(e.target.value)}
                  placeholder="Добавьте описание ставки (необязательно)"
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--background-second)] border border-[var(--background-second)] focus:border-[var(--primary)] focus:outline-none text-[var(--text)] resize-none"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-lg bg-[var(--primary)] text-white font-semibold hover:bg-[var(--primary)]/90 transition-all transform hover:scale-105"
                >
                  Добавить ставку
                </button>
                <button
                  type="button"
                  className="px-6 py-3 rounded-lg border-2 border-[var(--primary)] text-[var(--primary)] font-semibold hover:bg-[var(--primary)] hover:text-white transition-all"
                >
                  Очистить
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Блок с историей ставок */}
      <section className="w-full bg-[var(--background-second)] backdrop-blur-[7px] rounded-[30px] p-5 md:p-8">
        <div className="bg-[var(--secondary)] rounded-[20px] p-5 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <FiClock className="text-2xl text-[var(--primary)]" />
            <h2 className="text-2xl font-bold">История ставок</h2>
          </div>
          <div className="bg-[var(--primary)] rounded-xl p-5 md:p-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--background-second)]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-secondary)]">Дата</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-secondary)]">Название</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-secondary)]">Сумма</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-secondary)]">Коэффициент</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-secondary)]">Результат</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-secondary)]">Прибыль</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-[var(--text-secondary)]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FiBarChart2 className="text-3xl mb-2" />
                        <p className="text-lg">История ставок пуста</p>
                        <p className="text-sm">Ваши ставки будут отображаться здесь</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
