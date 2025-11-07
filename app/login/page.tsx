'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Auth() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<'email' | 'username'> ('email');
  const [erorr, setErorr] = useState<string | null> (null)
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErorr(null)

    const response = await fetch('../api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ loginMethod, email, username, password }),
    });

    if (response.ok) {
      router.push('/')
    } else {
      const data = await response.json().catch(() => null);
      setErorr(data?.message || 'Неверный логин или пароль')
    }
  };

  return (
    <div className="w-full max-w-[450px] mt-[5%] bg-[var(--background-second)] backdrop-blur-[7px] rounded-[30px] p-[40px] border border-[var(--primary)]/20">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Cash Flipper</h1>
        <p className="text-[var(--text-secondary)]">Войдите в свой аккаунт</p>
        {erorr && (
          <p className="text-red-500">{erorr}</p> 
        )}
      </header>

      <div className="mb-6 flex rounded-xl bg-[var(--secondary)] p-1">
        <button
          type="button"
          onClick={() => setLoginMethod('email')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${loginMethod === 'email'
              ? 'bg-[var(--primary)] text-white'
              : 'text-[var(--text-secondary)] hover:text-white'
            }`}
        >
          Почта
        </button>
        <button
          type="button"
          onClick={() => setLoginMethod('username')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${loginMethod === 'username'
              ? 'bg-[var(--primary)] text-white'
              : 'text-[var(--text-secondary)] hover:text-white'
            }`}
        >
          Никнейм
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor={loginMethod} className="block text-sm font-medium mb-2">
            {loginMethod === 'email' ? 'Почта' : 'Никнейм'}
          </label>
          <input
            type={loginMethod === 'email' ? 'email' : 'text'}
            id={loginMethod}
            value={loginMethod === 'email' ? email : username}
            onChange={(e) => loginMethod === 'email' ? setEmail(e.target.value) : setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--secondary)] border border-[var(--primary)]/20 focus:border-[var(--primary)] focus:outline-none transition-colors"
            placeholder={loginMethod === 'email' ? 'you@example.com' : 'your_username'}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Пароль
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--secondary)] border border-[var(--primary)]/20 focus:border-[var(--primary)] focus:outline-none transition-colors"
            placeholder="••••••••"
            required
          />
        </div>

        <div className="text-right">
          <a href="#" className="text-sm text-[var(--primary)] hover:underline">
            Забыли пароль?
          </a>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-semibold hover:bg-[var(--primary)]/90 transition-colors"
        >
          Войти
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-[var(--text-secondary)] text-sm mb-2">
          Нет аккаунта?
        </p>
        <Link
          href="/registration"
          className="inline-block w-full py-3 rounded-xl border-2 border-[var(--primary)] text-[var(--primary)] font-semibold hover:bg-[var(--primary)] hover:text-white transition-colors"
        >
          Создать аккаунт
        </Link>
      </div>
    </div>
  );
}