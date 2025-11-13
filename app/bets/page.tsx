'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart2,
  FiClock,
  FiPlus,
  FiTarget,
  FiActivity,
  FiTrash2,
  FiLayers,
} from 'react-icons/fi';

interface UserBalance {
  id: number;
  user_id: number;
  balance_type: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

type BetStatus = 'active' | 'win' | 'loss' | 'refund';

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

type BetType = 'single' | 'express';
type Discipline = 'cs2' | 'dota2' | '';
type BetScope = 'overall' | 'map';
type Market = 'winner' | 'total' | 'exact_score';
type TotalSide = 'over' | 'under' | null;

interface BetEventFormState {
  discipline: Discipline;
  teamA: string;
  teamB: string;
  scope: BetScope;
  mapNumber: number | null;
  market: Market;
  selection: string;
  totalSide: TotalSide;
  totalLine: number | null;
  odds: number | null;
}

const TOTAL_LINES = [18.5, 19.5, 20.5, 21.5, 22.5, 23.5];

const buildTotalSelection = (side: TotalSide, line: number | null) =>
  side && typeof line === 'number' ? `${side}_${line}` : '';

const STATUS_OPTIONS: { value: BetStatus; label: string }[] = [
  { value: 'active', label: 'Активная' },
  { value: 'win', label: 'Выигрыш' },
  { value: 'loss', label: 'Проигрыш' },
  { value: 'refund', label: 'Возврат' },
];

const STATUS_LABELS: Record<BetStatus, string> = STATUS_OPTIONS.reduce(
  (acc, item) => ({ ...acc, [item.value]: item.label }),
  { active: 'Активная', win: 'Выигрыш', loss: 'Проигрыш', refund: 'Возврат' } as Record<BetStatus, string>,
);

const STATUS_BADGE_CLASSES: Record<BetStatus, string> = {
  active: 'bg-yellow-400/10 text-yellow-200 border border-yellow-400/40',
  win: 'bg-green-500/15 text-green-200 border border-green-500/40',
  loss: 'bg-red-500/15 text-red-200 border border-red-500/40',
  refund: 'bg-white/20 text-white border border-white/40',
};

const TEAMS_BY_DISCIPLINE: Record<Exclude<Discipline, ''>, string[]> = {
  cs2: [
    'Team Spirit',
    'Team Vitality',
    'Natus Vincere',
    'MOUZ',
    'The Mongolz',
    'FaZe Clan',
    'G2 Esports',
    'Team Falcons',
    'FURIA Esports',
    'Aurora Gaming',
    'Astralis',
    'Heroic',
    'Eternal Fire',
    'Virtus.pro',
    'Team Liquid',
    'Team 3DMAX',
    'TYLOO',
    'paiN Gaming',
    'SAW',
    'GamerLegion',
    'BetBoom Team',
    'Complexity',
    'Legacy',
    'B8 Esports',
    'ENCE',
    'BIG',
    'Ninjas in Pyjamas',
    'Fnatic',
    'MIBR',
    'Nemiga Gaming',
  ],
  dota2: [
    'Team Falcons',
    'PARIVISION',
    'Team Spirit',
    'Xtreme Gaming',
    'BetBoom Team',
    'Gaimin Gladiators',
    'Team Liquid',
    'Team Tidebound',
    'Natus Vincere',
    'Aurora Gaming',
    'HEROIC',
    'Talon Esports',
    'MOUZ',
    'Virtus.pro',
    '1win Team',
    'Team Yandex',
    'Nigma Galaxy',
    'Tundra Esports',
    'Yakult Brothers',
    'L1GA TEAM',
    'AVULUS',
    'Most Wanted',
    'Runa Team',
    'Pipsqueak+4',
    'eSpoiled',
  ],
};

const createEmptyEvent = (): BetEventFormState => ({
  discipline: '',
  teamA: '',
  teamB: '',
  scope: 'overall',
  mapNumber: null,
  market: 'winner',
  selection: '',
  totalSide: null,
  totalLine: null,
  odds: null,
});

export default function Bets() {
  const [balance, setBalance] = useState<UserBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [betType, setBetType] = useState<BetType | null>(null);
  const [stakeAmount, setStakeAmount] = useState<number | null>(null);
  const [events, setEvents] = useState<BetEventFormState[]>([]);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [betsHistory, setBetsHistory] = useState<BetHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(true);
  const [updatingBetId, setUpdatingBetId] = useState<number | null>(null);
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistoryEntry[]>([]);
  const [isBalanceHistoryLoading, setIsBalanceHistoryLoading] = useState<boolean>(true);
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState<number | null>(null);
  const [isBalanceUpdating, setIsBalanceUpdating] = useState<boolean>(false);

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
      if (historyError instanceof Error) {
        setError(historyError.message);
      } else {
        setError('Не удалось загрузить историю ставок.');
      }
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
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setIsBalanceHistoryLoading(false);
    }
  }, []);

  const totalOdds =
    betType && events.length > 0
      ? betType === 'express'
        ? events.reduce((acc, event) => acc + (event.odds ?? 0), 0)
        : events[0]?.odds ?? 0
      : 0;

  const potentialPayout =
    stakeAmount && totalOdds
      ? Number((stakeAmount * totalOdds).toFixed(2))
      : 0;

  const resetForm = () => {
    setBetType(null);
    setStakeAmount(null);
    setEvents([]);
    setError('');
    setSuccessMessage('');
  };

  const validateEvent = (event: BetEventFormState, index: number) => {
    if (!event.discipline) {
      throw new Error(`Событие #${index + 1}: выберите дисциплину.`);
    }
    if (!event.teamA || !event.teamB) {
      throw new Error(`Событие #${index + 1}: выберите обе команды.`);
    }
    if (event.teamA === event.teamB) {
      throw new Error(`Событие #${index + 1}: команды должны отличаться.`);
    }
    if (event.scope === 'map') {
      if (!event.mapNumber) {
        throw new Error(`Событие #${index + 1}: выберите номер карты.`);
      }
    }
    if (event.market === 'total') {
      if (!event.totalSide || !event.totalLine) {
        throw new Error(`Событие #${index + 1}: заполните варианты тотала.`);
      }
    } else {
      if (event.totalSide || event.totalLine) {
        throw new Error(`Событие #${index + 1}: тотал доступен только для ставок на тотал.`);
      }
    }
    if (!event.selection) {
      throw new Error(`Событие #${index + 1}: выберите исход.`);
    }
    if (!event.odds || event.odds <= 0) {
      throw new Error(`Событие #${index + 1}: укажите коэффициент больше 0.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      if (!betType) {
        throw new Error('Выберите тип ставки.');
      }

      if (!stakeAmount || stakeAmount <= 0) {
        throw new Error('Укажите корректную сумму ставки.');
      }

      events.forEach((event, index) => validateEvent(event, index));

      if (betType === 'express' && events.length < 2) {
        throw new Error('Для экспресса необходимо минимум два события.');
      }

      const payload = {
        betType,
        category: 'cybersport',
        stakeAmount,
        totalOdds,
        events: events.map((event) => ({
          ...event,
          totalLine: event.totalLine ? Number(event.totalLine) : null,
          mapNumber: event.scope === 'map' ? event.mapNumber : null,
          totalSide: event.market === 'total' ? event.totalSide : null,
        })),
      };

      const response = await fetch('/api/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Не удалось создать ставку.');
      }

      if (typeof data.balance === 'number') {
        setBalance((prev) => {
          let updated = false;
          const next = prev.map((item) => {
            if (item.balance_type === 'bets') {
              updated = true;
              return { ...item, amount: Number(data.balance) };
            }
            return item;
          });
          return updated ? next : prev;
        });
      }

      await loadBetsHistory();
      await loadBalanceHistory();

      resetForm();
      setSuccessMessage('Ставка успешно создана.');
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Неизвестная ошибка.';
      setError(message);
    }
  };

  const handleStatusChange = async (betId: number, nextStatus: BetStatus) => {
    setError('');
    setSuccessMessage('');
    try {
      setUpdatingBetId(betId);
      const response = await fetch('/api/bets', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ betId, status: nextStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Не удалось обновить статус ставки.');
      }

      if (typeof data.balance === 'number') {
        setBalance((prev) => {
          let updated = false;
          const next = prev.map((item) => {
            if (item.balance_type === 'bets') {
              updated = true;
              return { ...item, amount: Number(data.balance) };
            }
            return item;
          });
          return updated ? next : prev;
        });
      }

      if (data.bet) {
        const normalizedEvents = Array.isArray(data.bet.events)
          ? data.bet.events.map((event: any) => ({
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
          : undefined;

        setBetsHistory((prev) =>
          prev.map((bet) =>
            bet.id === betId
              ? {
                  ...bet,
                  created_at: data.bet.created_at ?? data.bet.createdAt ?? bet.created_at,
                  updated_at: data.bet.updated_at ?? data.bet.updatedAt ?? new Date().toISOString(),
                  bet_type: (data.bet.bet_type as BetType) ?? bet.bet_type,
                  category: data.bet.category ?? bet.category,
                  stake_amount: Number(data.bet.stake_amount ?? bet.stake_amount ?? 0),
                  total_odds: Number(data.bet.total_odds ?? bet.total_odds ?? 0),
                  potential_payout: Number(data.bet.potential_payout ?? bet.potential_payout ?? 0),
                  status: (data.bet.status ?? nextStatus) as BetStatus,
                  events: normalizedEvents ?? bet.events,
                }
              : bet,
          ),
        );
      } else {
        setBetsHistory((prev) =>
          prev.map((bet) => (bet.id === betId ? { ...bet, status: nextStatus } : bet)),
        );
      }

      await loadBalanceHistory();

      setSuccessMessage(`Статус ставки #${betId} обновлён.`);
    } catch (statusError) {
      console.error('Ошибка обновления статуса ставки:', statusError);
      const message =
        statusError instanceof Error ? statusError.message : 'Не удалось обновить статус ставки.';
      setError(message);
      await loadBetsHistory();
    } finally {
      setUpdatingBetId(null);
    }
  };

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

  const historyStats = useMemo(() => {
    if (!betsHistory.length) {
      return {
        wins: 0,
        losses: 0,
        total: 0,
        successRate: 0,
      };
    }

    const wins = betsHistory.filter((bet) => bet.status === 'win').length;
    const losses = betsHistory.filter((bet) => bet.status === 'loss').length;
    const total = betsHistory.length;
    const resolved = wins + losses;
    const successRate = resolved === 0 ? 0 : Math.round((wins / resolved) * 100);

    return {
      wins,
      losses,
      total,
      successRate,
    };
  }, [betsHistory]);

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
    const minValue = 0; // Начинаем с 0 как требуется
    const maxValue = Math.max(...values, 1); // Максимальное значение amount_after
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

    // Создаем путь для линейного графика, соединяющий все точки
    const path = points.length > 0
      ? points
          .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
          .join(' ')
      : '';

    const fillPath = `${path} L${points[points.length - 1].x},${padding.top + plotHeight} L${padding.left},${padding.top + plotHeight} Z`;

    // Y-метки: 0, среднее значение, максимальное значение
    const yTicksValues = [0, maxValue / 2, maxValue].filter(v => v >= 0);
    const yTicks = yTicksValues.map((value) => ({
      value,
      y: padding.top + plotHeight - ((value - minValue) / valueRange) * plotHeight,
    }));

    // X-метки: первая, средняя, последняя дата
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

  const handleBetTypeChange = (value: BetType) => {
    setError('');
    setSuccessMessage('');
    setBetType(value);
    setEvents(value === 'express' ? [createEmptyEvent(), createEmptyEvent()] : [createEmptyEvent()]);
  };

  const updateEvent = (index: number, changes: Partial<BetEventFormState>) => {
    setEvents((prev) =>
      prev.map((event, idx) => {
        if (idx !== index) return event;

        const updated: BetEventFormState = { ...event, ...changes };

        if (changes.market && changes.market !== event.market) {
          updated.selection = '';
          updated.totalSide = null;
          updated.totalLine = null;
        }

        if (changes.scope) {
          if (changes.scope === 'overall') {
            updated.mapNumber = null;
            if (updated.market === 'total' && updated.totalLine && updated.totalLine !== 2.5) {
              updated.totalLine = 2.5;
            }
          } else if (changes.scope === 'map' && updated.market === 'total' && updated.totalLine === 2.5) {
            updated.totalLine = null;
          }
        }

        if (changes.discipline && changes.discipline !== event.discipline) {
          updated.teamA = '';
          updated.teamB = '';
        }

        if (updated.market === 'total') {
          const selection = buildTotalSelection(updated.totalSide, updated.totalLine);
          updated.selection = selection;
        }

        return updated;
      }),
    );
  };

  const addEvent = () => {
    setEvents((prev) => [...prev, createEmptyEvent()]);
  };

  const removeEvent = (index: number) => {
    setEvents((prev) => prev.filter((_, idx) => idx !== index));
  };

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const response = await fetch('/api/balance');
        const data = await response.json();
        if (data.balance) {
          // Убеждаемся, что amount всегда число
          const normalizedBalance = Array.isArray(data.balance)
            ? data.balance.map((item: any) => ({
                ...item,
                amount: Number(item.amount ?? 0),
              }))
            : [];
          setBalance(normalizedBalance);
        }
        await Promise.all([loadBetsHistory(), loadBalanceHistory()]);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        setError('Не удалось загрузить данные пользователя.');
      } finally {
        setIsLoading(false);
      }
    };
    loadInitial();
  }, [loadBetsHistory, loadBalanceHistory]);

  const betsBalance = Number(balance.find(b => b.balance_type === 'bets')?.amount || 0);

  const handleBalanceAdjust = async (operation: 'add' | 'subtract') => {
    if (!balanceAdjustAmount || balanceAdjustAmount <= 0) {
      setError('Введите корректную сумму.');
      return;
    }

    setError('');
    setSuccessMessage('');
    setIsBalanceUpdating(true);

    try {
      const response = await fetch('/api/balance', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: balanceAdjustAmount,
          operation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Не удалось изменить баланс.');
      }

      // Обновляем баланс в состоянии
      setBalance((prev) => {
        let updated = false;
        const next = prev.map((item) => {
          if (item.balance_type === 'bets') {
            updated = true;
            return { ...item, amount: Number(data.balance) };
          }
          return item;
        });
        return updated ? next : prev;
      });

      setBalanceAdjustAmount(null);
      setSuccessMessage(data.message || 'Баланс успешно обновлён.');
    } catch (adjustError) {
      console.error('Ошибка изменения баланса:', adjustError);
      const message = adjustError instanceof Error ? adjustError.message : 'Не удалось изменить баланс.';
      setError(message);
    } finally {
      setIsBalanceUpdating(false);
    }
  };

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
            <p className="text-4xl font-bold text-green-400">{betsBalance.toFixed(2)}$</p>
            
            {/* Блок изменения баланса */}
            <div className="mt-6 pt-6 border-t border-[var(--background-second)]">
              <p className="text-sm font-semibold mb-3">Изменить баланс</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="number"
                  value={balanceAdjustAmount ?? ''}
                  onChange={(e) => setBalanceAdjustAmount(e.target.valueAsNumber || null)}
                  placeholder="Сумма"
                  step="0.01"
                  min="0.01"
                  className="flex-1 px-4 py-2 rounded-lg bg-[var(--background-second)] border border-[var(--background-second)] focus:border-[var(--primary)] focus:outline-none text-[var(--text)]"
                  disabled={isBalanceUpdating}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleBalanceAdjust('add')}
                    disabled={isBalanceUpdating || !balanceAdjustAmount || balanceAdjustAmount <= 0}
                    className="px-6 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <FiPlus />
                    Добавить
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBalanceAdjust('subtract')}
                    disabled={isBalanceUpdating || !balanceAdjustAmount || balanceAdjustAmount <= 0}
                    className="px-6 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <FiTrendingDown />
                    Убавить
                  </button>
                </div>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[var(--primary)] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <FiTrendingUp className="text-green-400" />
                <p className="text-sm text-[var(--text-secondary)]">Выигрыши</p>
              </div>
              <p className="text-2xl font-bold">{historyStats.wins}</p>
            </div>
            <div className="bg-[var(--primary)] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <FiTrendingDown className="text-red-400" />
                <p className="text-sm text-[var(--text-secondary)]">Проигрыши</p>
              </div>
              <p className="text-2xl font-bold">{historyStats.losses}</p>
            </div>
            <div className="bg-[var(--primary)] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <FiTarget className="text-[var(--primary)]" />
                <p className="text-sm text-[var(--text-secondary)]">Всего ставок</p>
              </div>
              <p className="text-2xl font-bold">{historyStats.total}</p>
            </div>
            <div className="bg-[var(--primary)] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <FiActivity className="text-yellow-400" />
                <p className="text-sm text-[var(--text-secondary)]">Процент успеха</p>
              </div>
              <p className="text-2xl font-bold">{historyStats.successRate}%</p>
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
            {error && (
              <div className="mb-4 p-4 rounded-lg bg-red-500/20 text-red-400 border border-red-500/50">
                <p className="text-lg">{error}</p>    
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-4 rounded-lg bg-green-500/20 text-green-400 border border-green-500/50">
                <p className="text-lg">{successMessage}</p>    
              </div>
            )}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-semibold mb-2">Тип ставки</label>
                <select
                  value={betType || ''}
                  onChange={(e) => handleBetTypeChange(e.target.value as BetType)}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--background-second)] border border-[var(--background-second)] focus:border-[var(--primary)] focus:outline-none text-[var(--text)]"
                >
                  <option value="">Выберите тип ставки</option>
                  <option value="single">Одиночная</option>
                  <option value="express">Экспресс</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Сумма ставки</label>
                <input
                  type="number"
                  value={stakeAmount ?? ''}
                  onChange={(e) => setStakeAmount(e.target.valueAsNumber)}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-lg bg-[var(--background-second)] border border-[var(--background-second)] focus:border-[var(--primary)] focus:outline-none text-[var(--text)]"
                />
              </div>
              {betType === 'express' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Коэффициент</label>
                    <input
                      type="number"
                      value={totalOdds}
                      onChange={(e) => {}}
                      placeholder="1.00"
                      step="0.01"
                      className="w-full px-4 py-3 rounded-lg bg-[var(--background-second)] border border-[var(--background-second)] focus:border-[var(--primary)] focus:outline-none text-[var(--text)]"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Потенциальный выигрыш</label>
                    <input
                      type="number"
                      value={potentialPayout}
                      onChange={(e) => {}}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full px-4 py-3 rounded-lg bg-[var(--background-second)] border border-[var(--background-second)] focus:border-[var(--primary)] focus:outline-none text-[var(--text)]"
                      disabled
                    />
                  </div>
                </div>
              )}
              {betType === 'single' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">Коэффициент</label>
                  <input
                    type="number"
                    value={totalOdds}
                    onChange={(e) => {}}
                    placeholder="1.00"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-lg bg-[var(--background-second)] border border-[var(--background-second)] focus:border-[var(--primary)] focus:outline-none text-[var(--text)]"
                    disabled
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold mb-2">События</label>
                {events.map((event, index) => (
                  <div key={index} className="bg-[var(--background-second)] rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold">Событие {index + 1}</h3>
                      {events.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEvent(index)}
                          className="text-red-400 hover:text-red-500"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1">Дисциплина</label>
                        <select
                          value={event.discipline || ''}
                          onChange={(e) => updateEvent(index, { discipline: e.target.value as Discipline })}
                          className="w-full px-4 py-3 rounded-lg bg-[var(--background-second)] border border-[var(--background-second)] focus:border-[var(--primary)] focus:outline-none text-[var(--text)]"
                        >
                          <option value="">Выберите дисциплину</option>
                          <option value="dota2">Dota 2</option>
                          <option value="csgo">CS:GO</option>
                          <option value="lol">League of Legends</option>
                          <option value="valorant">Valorant</option>
                          <option value="overwatch">Overwatch</option>
                          <option value="rocketleague">Rocket League</option>
                          <option value="fifa">FIFA</option>
                          <option value="nba">NBA</option>
                          <option value="nfl">NFL</option>
                          <option value="mlb">MLB</option>
                          <option value="nhl">NHL</option>
                          <option value="tennis">Tennis</option>
                          <option value="basketball">Basketball</option>
                          <option value="hockey">Hockey</option>
                          <option value="baseball">Baseball</option>
                          <option value="football">Football</option>
                          <option value="tennis">Tennis</option>
                          <option value="basketball">Basketball</option>
                          <option value="hockey">Hockey</option>
                          <option value="baseball">Baseball</option>
                          <option value="football">Football</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">Команды</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={event.teamA}
                            onChange={(e) => updateEvent(index, { teamA: e.target.value })}
                            placeholder="Команда 1"
                            className="w-full px-4 py-3 rounded-lg bg-[var(--background-second)] border border-[var(--background-second)] focus:border-[var(--primary)] focus:outline-none text-[var(--text)]"
                          />
                          <input
                            type="text"
                            value={event.teamB}
                            onChange={(e) => updateEvent(index, { teamB: e.target.value })}
                            placeholder="Команда 2"
                            className="w-full px-4 py-3 rounded-lg bg-[var(--background-second)] border border-[var(--background-second)] focus:border-[var(--primary)] focus:outline-none text-[var(--text)]"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1">Сфера</label>
                        <select
                          value={event.scope || ''}
                          onChange={(e) => updateEvent(index, { scope: e.target.value as BetScope })}
                          className="w-full px-4 py-3 rounded-lg bg-[var(--background-second)] border border-[var(--background-second)] focus:border-[var(--primary)] focus:outline-none text-[var(--text)]"
                        >
                          <option value="">Выберите сферу</option>
                          <option value="overall">Общая</option>
                          <option value="map">Карта</option>
                        </select>
                      </div>
                      {event.scope === 'map' && (
                        <div>
                          <label className="block text-sm font-semibold mb-1">Номер карты</label>
                          <input
                            type="number"
                            value={event.mapNumber ?? ''}
                            onChange={(e) => updateEvent(index, { mapNumber: e.target.valueAsNumber })}
                            placeholder="Введите номер карты"
                            className="w-full px-4 py-3 rounded-lg bg-[var(--background-second)] border border-[var(--background-second)] focus:border-[var(--primary)] focus:outline-none text-[var(--text)]"
                          />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1">Рынок</label>
                        <select
                          value={event.market || ''}
                          onChange={(e) => updateEvent(index, { market: e.target.value as Market })}
                          className="w-full px-4 py-3 rounded-lg bg-[var(--background-second)] border border-[var(--background-second)] focus:border-[var(--primary)] focus:outline-none text-[var(--text)]"
                        >
                          <option value="">Выберите рынок</option>
                          <option value="winner">Победитель</option>
                          <option value="total">Тотал</option>
                          <option value="exact_score">Точный счёт</option>
                        </select>
                      </div>
                      {event.market === 'total' && (
                        <div>
                          <label className="block text-sm font-semibold mb-1">Тотал</label>
                          <select
                            value={event.totalSide || ''}
                            onChange={(e) => updateEvent(index, { totalSide: e.target.value as TotalSide })}
                            className="w-full px-4 py-3 rounded-lg bg-[var(--background-second)] border border-[var(--background-second)] focus:border-[var(--primary)] focus:outline-none text-[var(--text)]"
                          >
                            <option value="">Выберите тотал</option>
                            <option value="over">Больше</option>
                            <option value="under">Меньше</option>
                          </select>
                          <input
                            type="number"
                            value={event.totalLine ?? ''}
                            onChange={(e) => updateEvent(index, { totalLine: e.target.valueAsNumber })}
                            placeholder="Введите тотал"
                            className="w-full px-4 py-3 rounded-lg bg-[var(--background-second)] border border-[var(--background-second)] focus:border-[var(--primary)] focus:outline-none text-[var(--text)]"
                          />
                        </div>
                      )}
                      {event.market === 'exact_score' && (
                        <div>
                          <label className="block text-sm font-semibold mb-1">Точный счёт</label>
                          <input
                            type="text"
                            value={event.selection}
                            onChange={(e) => updateEvent(index, { selection: e.target.value })}
                            placeholder="Введите точный счёт (например, 1:0)"
                            className="w-full px-4 py-3 rounded-lg bg-[var(--background-second)] border border-[var(--background-second)] focus:border-[var(--primary)] focus:outline-none text-[var(--text)]"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Коэффициент</label>
                      <input
                        type="number"
                        value={event.odds ?? ''}
                        onChange={(e) => updateEvent(index, { odds: e.target.valueAsNumber })}
                        placeholder="1.00"
                        step="0.01"
                        className="w-full px-4 py-3 rounded-lg bg-[var(--background-second)] border border-[var(--background-second)] focus:border-[var(--primary)] focus:outline-none text-[var(--text)]"
                      />
                    </div>
                  </div>
                ))}
                {betType === 'express' && (
                  <button
                    type="button"
                    onClick={addEvent}
                    className="w-full px-6 py-3 rounded-lg bg-[var(--primary)] text-white font-semibold hover:bg-[var(--primary)]/90 transition-all transform hover:scale-105"
                  >
                    Добавить событие
                  </button>
                )}
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
                  {isHistoryLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-[var(--text-secondary)]">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FiBarChart2 className="text-3xl mb-2" />
                          <p className="text-lg">Загрузка истории ставок...</p>
                        </div>
                      </td>
                    </tr>
                  ) : betsHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-[var(--text-secondary)]">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FiBarChart2 className="text-3xl mb-2" />
                          <p className="text-lg">История ставок пуста</p>
                          <p className="text-sm">Ваши ставки будут отображаться здесь</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    betsHistory.map((bet) => (
                      <tr key={bet.id} className="border-b border-[var(--background-second)]">
                        <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">{new Date(bet.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">{formatBetName(bet)}</td>
                        <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">{bet.stake_amount.toFixed(2)}$</td>
                        <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">{bet.total_odds.toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">{formatBetOutcome(bet)}</td>
                        <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">
                          {bet.status === 'win' ? `+${(bet.potential_payout - bet.stake_amount).toFixed(2)}$` : `-${bet.stake_amount.toFixed(2)}$`}
                        </td>
                        <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">
                          <select
                            value={bet.status}
                            onChange={(e) => handleStatusChange(bet.id, e.target.value as BetStatus)}
                            className="bg-[var(--background-second)] border border-[var(--background-second)] rounded-lg px-2 py-1 text-sm"
                          >
                            <option value="active">Активна</option>
                            <option value="win">Выиграла</option>
                            <option value="loss">Проиграла</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
