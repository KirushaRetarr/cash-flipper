"use client"

import { useState, useEffect } from 'react'
import { FiUser, FiDollarSign, FiTarget, FiLogOut } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface UserBalance {
  id: number;
  user_id: number;
  balance_type: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

interface UserInfo {
  id: number;
  username: string;
  email: string;
  avatar_url: string | null;
  theme: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export default function Profile() {
  const router = useRouter();
  const [balance, setBalance] = useState<UserBalance[]>([])
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isAuth, setIsAuth] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const response = await fetch('/api/auth');
      const data = await response.json();
      setIsAuth(data.isAuthenticated);
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

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch('/api/user')
        const data = await response.json()
        if (data.user && data.user.length > 0) {
          setUser(data.user[0]) // Берем первый элемент массива
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Ошибка загрузки пользователя:', error)
        setIsLoading(false)
      }
    }
    loadUser()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Ошибка выхода:', error);
      router.push('/');
      router.refresh();
    }
  }

  const betsBalance = balance.find(b => b.balance_type === 'bets')?.amount || 0;
  const cryptoBalance = balance.find(b => b.balance_type === 'crypto')?.amount || 0;

  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-full min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <>
      {isAuth && user ? (
        <div className="w-full max-w-4xl mt-[60px] p-5 space-y-6">
          {/* Карточка профиля */}
          <section className="bg-[var(--background-second)] backdrop-blur-[7px] rounded-[30px] p-8 border border-[var(--primary)]/20">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Аватар */}
              <div className="relative group">
                <div className="cursor-pointer w-32 h-32 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-110">
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.username}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-5xl font-bold text-white">
                        {getInitials(user.username)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-[var(--background-second)]"></div>
              </div>

              {/* Информация о пользователе */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
                  {user.username}
                </h1>
                <p className="text-[var(--text-secondary)] text-lg mb-4 flex items-center justify-center md:justify-start gap-2">
                  <span>{user.email}</span>
                </p>
                <div className="flex gap-2 justify-center md:justify-start">
                  <span className="px-3 py-1 bg-[var(--secondary)] rounded-full text-sm text-[var(--text-secondary)]">
                    ID: {user.id}
                  </span>
                  <span className="px-3 py-1 bg-[var(--secondary)] rounded-full text-sm text-[var(--text-secondary)]">
                    Участник с {new Date(user.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>

              {/* Кнопка выхода */}
              <button
                onClick={handleLogout}
                className="cursor-pointer px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
              >
                <FiLogOut className="text-xl" />
                Выйти
              </button>
            </div>
          </section>

          {/* Балансы */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Баланс ставок */}
            <section className="bg-[var(--background-second)] backdrop-blur-[7px] rounded-[30px] p-6 border border-[var(--primary)]/20 hover:border-[var(--primary)]/40 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FiTarget className="text-2xl text-white" />
                  </div>
                  <h2 className="text-xl font-semibold">Баланс ставок</h2>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-4xl font-bold text-green-400">
                  ${typeof betsBalance === 'number' ? betsBalance.toFixed(2) : parseFloat(betsBalance).toFixed(2)}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">Виртуальный баланс для ставок</p>
              </div>
            </section>

            {/* Баланс крипто */}
            <section className="bg-[var(--background-second)] backdrop-blur-[7px] rounded-[30px] p-6 border border-[var(--primary)]/20 hover:border-[var(--primary)]/40 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FiDollarSign className="text-2xl text-white" />
                  </div>
                  <h2 className="text-xl font-semibold">Баланс крипто</h2>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-4xl font-bold text-green-400">
                  ${typeof cryptoBalance === 'number' ? cryptoBalance.toFixed(2) : parseFloat(cryptoBalance).toFixed(2)}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">Виртуальный баланс для крипто-трейдинга</p>
              </div>
            </section>
          </div>

          {/* Статистика */}
          <section className="bg-[var(--background-second)] backdrop-blur-[7px] rounded-[30px] p-6 border border-[var(--primary)]/20">
            <h2 className="text-2xl font-bold mb-4">Статистика аккаунта</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-[var(--secondary)] rounded-xl">
                <p className="text-sm text-[var(--text-secondary)] mb-1">Дата регистрации</p>
                <p className="text-lg font-semibold">
                  {new Date(user.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
              <div className="p-4 bg-[var(--secondary)] rounded-xl">
                <p className="text-sm text-[var(--text-secondary)] mb-1">Тема</p>
                <p className="text-lg font-semibold capitalize">{user.theme || 'dark'}</p>
              </div>
              <div className="p-4 bg-[var(--secondary)] rounded-xl">
                <p className="text-sm text-[var(--text-secondary)] mb-1">Язык</p>
                <p className="text-lg font-semibold uppercase">{user.language || 'ru'}</p>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className="w-full h-[800px] flex justify-center items-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Not Found</h1>
            <p className="text-[var(--text-secondary)]">Страница недоступна</p>
          </div>
        </div>
      )}
    </>
  );
}