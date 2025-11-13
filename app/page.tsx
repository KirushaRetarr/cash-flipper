'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { FiTrendingUp, FiDollarSign, FiTarget, FiZap, FiLock, FiActivity, FiBarChart2, FiArrowUpRight, FiClock } from 'react-icons/fi';

interface UserBalance {
  id: number;
  user_id: number;
  balance_type: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

type BetStatus = 'active' | 'win' | 'loss' | 'refund';
type BetType = 'single' | 'express';
type Discipline = 'cs2' | 'dota2' | '';
type BetScope = 'overall' | 'map';
type Market = 'winner' | 'total' | 'exact_score';

interface BetEventHistory {
  id: number;
  discipline: Discipline;
  teamA?: string;
  teamB?: string;
  teama?: string;
  teamb?: string;
  scope: BetScope;
  mapNumber?: number | null;
  mapnumber?: number | null;
  market: Market;
  selection: string;
  odds: number;
}

interface BetHistoryItem {
  id: number;
  created_at: string;
  updated_at: string;
  bet_type: BetType;
  category: string;
  stake_amount: number;
  total_odds: number;
  potential_payout: number;
  status: BetStatus;
  events: BetEventHistory[];
}

interface BalanceHistoryEntry {
  id: number;
  balance_type: string;
  amount_before: number;
  amount_after: number;
  change_type: string;
  related_id: number | null;
  description: string | null;
  created_at: string;
}

export default function Home() {
  const [isAuth, setIsAuth] = useState(false)
  const [user, setUser] = useState<{ id: number; username: string; email: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [balance, setBalance] = useState<UserBalance[]>([])
  const [betsHistory, setBetsHistory] = useState<BetHistoryItem[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(true)
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistoryEntry[]>([])
  const [isBalanceHistoryLoading, setIsBalanceHistoryLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table')

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

  const loadBetsHistory = useCallback(async () => {
    try {
      setIsHistoryLoading(true);
      const response = await fetch('/api/bets', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Не удалось загрузить историю ставок.');
      }

      const normalized: BetHistoryItem[] = Array.isArray(data.bets)
        ? data.bets.map((bet: any) => ({
            id: bet.id,
            created_at: bet.created_at,
            updated_at: bet.updated_at,
            bet_type: bet.bet_type,
            category: bet.category,
            stake_amount: Number(bet.stake_amount ?? 0),
            total_odds: Number(bet.total_odds ?? 0),
            potential_payout: Number(bet.potential_payout ?? 0),
            status: (bet.status ?? 'active') as BetStatus,
            events: Array.isArray(bet.events)
              ? bet.events.map((event: any) => ({
                  id: event.id,
                  discipline: event.discipline as Discipline,
                  teamA: event.teamA ?? event.teama ?? event.team_a ?? '',
                  teamB: event.teamB ?? event.teamb ?? event.team_b ?? '',
                  scope: event.scope as BetScope,
                  mapNumber: event.mapNumber ?? event.mapnumber ?? event.map_number ?? null,
                  market: event.market as Market,
                  selection: event.selection,
                  odds: Number(event.odds ?? 0),
                }))
              : [],
          }))
        : [];

      setBetsHistory(normalized);
    } catch (historyError) {
      console.error('Ошибка загрузки истории ставок:', historyError);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  const loadBalanceHistory = useCallback(async () => {
    try {
      setIsBalanceHistoryLoading(true);
      const response = await fetch('/api/balance/history', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Не удалось загрузить историю баланса.');
      }

      const normalized: BalanceHistoryEntry[] = Array.isArray(data.history)
        ? data.history.map((entry: any) => ({
            id: entry.id,
            balance_type: entry.balance_type,
            amount_before: Number(entry.amount_before ?? 0),
            amount_after: Number(entry.amount_after ?? 0),
            change_type: entry.change_type ?? '',
            related_id: entry.related_id ?? null,
            description: entry.description ?? '',
            created_at: entry.created_at,
          }))
        : [];

      setBalanceHistory(normalized);
    } catch (err) {
      console.error('Ошибка загрузки истории баланса:', err);
    } finally {
      setIsBalanceHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/balance')
        const data = await response.json()
        if (data.balance) {
          const normalizedBalance = Array.isArray(data.balance)
            ? data.balance.map((item: any) => ({
                ...item,
                amount: Number(item.amount ?? 0),
              }))
            : [];
          setBalance(normalizedBalance)
        }
        if (isAuth) {
          await Promise.all([loadBetsHistory(), loadBalanceHistory()]);
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
      }
    }
    loadData()
  }, [isAuth, loadBetsHistory, loadBalanceHistory])

  const betsBalance = Number(balance.find(b => b.balance_type === 'bets')?.amount || 0);
  const cryptoBalance = Number(balance.find(b => b.balance_type === 'crypto')?.amount || 0);

  const formatBetName = (bet: BetHistoryItem) => {
    if (!bet.events || bet.events.length === 0) {
      return '—';
    }
    const event = bet.events[0];
    const teamA = event.teamA ?? event.teama ?? 'Команда 1';
    const teamB = event.teamB ?? event.teamb ?? 'Команда 2';
    return `${teamA} vs ${teamB}`;
  };

  const formatBetOutcome = (bet: BetHistoryItem) => {
    if (!bet.events || bet.events.length === 0) {
      return '—';
    }
    const event = bet.events[0];
    if (event.market === 'winner') {
      if (event.selection === 'teamA') {
        return `${event.teamA ?? 'Команда 1'}`;
      }
      if (event.selection === 'teamB') {
        return `${event.teamB ?? 'Команда 2'}`;
      }
      return 'Победитель';
    }
    if (event.market === 'total') {
      const [side, total] = event.selection?.split('_') ?? [];
      const sideLabel = side === 'over' ? 'Тотал Б' : side === 'under' ? 'Тотал М' : 'Тотал';
      return `${sideLabel} ${total ?? ''}`.trim();
    }
    if (event.market === 'exact_score') {
      return `Счёт ${event.selection}`;
    }
    return '—';
  };

  const balanceChart = useMemo(() => {
    if (!balanceHistory.length) {
      return null;
    }

    const chartWidth = 600;
    const chartHeight = 200;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;
    
    const values = balanceHistory.map((entry) => Number(entry.amount_after ?? 0));
    const timestamps = balanceHistory.map((entry) => new Date(entry.created_at));
    const minValue = 0;
    const maxValue = Math.max(...values, 1);
    const valueRange = maxValue - minValue || 1;
    const lastIndex = values.length - 1 || 1;

    const points = values.map((value, index) => {
      const x = lastIndex === 0 
        ? padding.left + plotWidth / 2 
        : padding.left + (index / lastIndex) * plotWidth;
      const y = padding.top + plotHeight - ((value - minValue) / valueRange) * plotHeight;
      return {
        x,
        y,
        value,
        timestamp: timestamps[index],
        label: timestamps[index].toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
    });

    const path = points.length > 0
      ? points
          .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
          .join(' ')
      : '';

    const fillPath = `${path} L${points[points.length - 1]?.x || padding.left},${padding.top + plotHeight} L${padding.left},${padding.top + plotHeight} Z`;

    const yTicksValues = [0, maxValue / 2, maxValue].filter(v => v >= 0);
    const yTicks = yTicksValues.map((value) => ({
      value,
      y: padding.top + plotHeight - ((value - minValue) / valueRange) * plotHeight,
    }));

    const xTickIndexes = Array.from(new Set([0, Math.floor(lastIndex / 2), lastIndex].filter((idx) => idx >= 0 && idx < timestamps.length)));
    const xTicks = xTickIndexes.map((idx) => ({
      label: timestamps[idx].toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      x: points[idx].x,
    }));

    return {
      width: chartWidth,
      height: chartHeight,
      padding,
      minValue,
      maxValue,
      points,
      path,
      fillPath,
      yTicks,
      xTicks,
    };
  }, [balanceHistory]);

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
                  {/* Переключатель вкладок */}
                  <div className="flex gap-2 mb-4 border-b border-[var(--background-second)]">
                    <button
                      onClick={() => setActiveTab('table')}
                      className={`px-4 py-2 font-semibold transition-all ${
                        activeTab === 'table'
                          ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FiClock />
                        Таблица ставок
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('chart')}
                      className={`px-4 py-2 font-semibold transition-all ${
                        activeTab === 'chart'
                          ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FiTrendingUp />
                        График баланса
                      </div>
                    </button>
                  </div>

                  {/* Таблица ставок */}
                  {activeTab === 'table' && (
                    <div className="overflow-x-auto">
                      {isHistoryLoading ? (
                        <div className="text-center py-12 text-[var(--text-secondary)]">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <FiBarChart2 className="text-3xl mb-2 animate-spin" />
                            <p className="text-lg">Загрузка истории ставок...</p>
                          </div>
                        </div>
                      ) : betsHistory.length === 0 ? (
                        <div className="text-center py-12 text-[var(--text-secondary)]">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <FiBarChart2 className="text-3xl mb-2" />
                            <p className="text-lg">История ставок пуста</p>
                            <p className="text-sm">Ваши ставки будут отображаться здесь</p>
                          </div>
                        </div>
                      ) : (
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
                            {betsHistory.slice(0, 10).map((bet) => (
                              <tr key={bet.id} className="border-b border-[var(--background-second)]">
                                <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">
                                  {new Date(bet.created_at).toLocaleDateString('ru-RU')}
                                </td>
                                <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">{formatBetName(bet)}</td>
                                <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">{bet.stake_amount.toFixed(2)}$</td>
                                <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">{bet.total_odds.toFixed(2)}</td>
                                <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">{formatBetOutcome(bet)}</td>
                                <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">
                                  {bet.status === 'win' 
                                    ? `+${(bet.potential_payout - bet.stake_amount).toFixed(2)}$` 
                                    : `-${bet.stake_amount.toFixed(2)}$`}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {/* График баланса */}
                  {activeTab === 'chart' && (
                    <div>
                      {isBalanceHistoryLoading ? (
                        <div className="flex items-center justify-center h-[200px]">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--primary)]"></div>
                        </div>
                      ) : balanceChart ? (
                        <div className="w-full overflow-x-auto">
                          <svg
                            width={balanceChart.width}
                            height={balanceChart.height}
                            className="w-full"
                            viewBox={`0 0 ${balanceChart.width} ${balanceChart.height}`}
                            preserveAspectRatio="xMidYMid meet"
                          >
                            <defs>
                              <linearGradient id="homeBalanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#8A5A83" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#8A5A83" stopOpacity="0.05" />
                              </linearGradient>
                            </defs>
                            
                            {balanceChart.yTicks.map((tick, idx) => (
                              <line
                                key={`grid-y-${idx}`}
                                x1={balanceChart.padding.left}
                                y1={tick.y}
                                x2={balanceChart.width - balanceChart.padding.right}
                                y2={tick.y}
                                stroke="#3535358f"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                              />
                            ))}
                            
                            <path
                              d={balanceChart.fillPath}
                              fill="url(#homeBalanceGradient)"
                            />
                            
                            <path
                              d={balanceChart.path}
                              fill="none"
                              stroke="#8A5A83"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            
                            {balanceChart.points.map((point, idx) => (
                              <g key={`point-${idx}`}>
                                <circle
                                  cx={point.x}
                                  cy={point.y}
                                  r="4"
                                  fill="#8A5A83"
                                  stroke="#3535358f"
                                  strokeWidth="2"
                                />
                                <title>
                                  {point.label}: {point.value.toFixed(2)}$
                                </title>
                              </g>
                            ))}
                            
                            {balanceChart.yTicks.map((tick, idx) => (
                              <g key={`y-tick-${idx}`}>
                                <line
                                  x1={balanceChart.padding.left - 5}
                                  y1={tick.y}
                                  x2={balanceChart.padding.left}
                                  y2={tick.y}
                                  stroke="#aaaaaa"
                                  strokeWidth="1"
                                />
                                <text
                                  x={balanceChart.padding.left - 10}
                                  y={tick.y + 4}
                                  textAnchor="end"
                                  fontSize="12"
                                  fill="#aaaaaa"
                                >
                                  {tick.value.toFixed(0)}
                                </text>
                              </g>
                            ))}
                            
                            {balanceChart.xTicks.map((tick, idx) => (
                              <g key={`x-tick-${idx}`}>
                                <line
                                  x1={tick.x}
                                  y1={balanceChart.height - balanceChart.padding.bottom}
                                  x2={tick.x}
                                  y2={balanceChart.height - balanceChart.padding.bottom + 5}
                                  stroke="#aaaaaa"
                                  strokeWidth="1"
                                />
                                <text
                                  x={tick.x}
                                  y={balanceChart.height - balanceChart.padding.bottom + 20}
                                  textAnchor="middle"
                                  fontSize="11"
                                  fill="#aaaaaa"
                                >
                                  {tick.label}
                                </text>
                              </g>
                            ))}
                            
                            <line
                              x1={balanceChart.padding.left}
                              y1={balanceChart.padding.top}
                              x2={balanceChart.padding.left}
                              y2={balanceChart.height - balanceChart.padding.bottom}
                              stroke="#aaaaaa"
                              strokeWidth="2"
                            />
                            <line
                              x1={balanceChart.padding.left}
                              y1={balanceChart.height - balanceChart.padding.bottom}
                              x2={balanceChart.width - balanceChart.padding.right}
                              y2={balanceChart.height - balanceChart.padding.bottom}
                              stroke="#aaaaaa"
                              strokeWidth="2"
                            />
                          </svg>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-[200px] text-[var(--text-secondary)]">
                          <div className="text-center">
                            <FiBarChart2 className="text-3xl mx-auto mb-2" />
                            <p>Нет данных для отображения</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
