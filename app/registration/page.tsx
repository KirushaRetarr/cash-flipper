'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Reg() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [succes, setSucces] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const response = await fetch('../api/registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      throw new Error('Failed to register');
    }

    setSucces('Вы успешно зарегистрировались!')
  };

  return (
      <div className="w-full max-w-[450px] mt-[5%] bg-[var(--background-second)] backdrop-blur-[7px] rounded-[30px] p-[40px] border border-[var(--primary)]/20">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Cash Flipper</h1>
          <p className="text-[var(--text-secondary)]">Создайте свой аккаунт</p>
          {succes && (
            <p className="text-green-500">{succes}</p> 
          )}
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2"> Никнейм </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--secondary)] border border-[var(--primary)]/20 focus:border-[var(--primary)] focus:outline-none transition-colors"
              placeholder="your_username"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2"> Почта </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--secondary)] border border-[var(--primary)]/20 focus:border-[var(--primary)] focus:outline-none transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2"> Пароль </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--secondary)] border border-[var(--primary)]/20 focus:border-[var(--primary)] focus:outline-none transition-colors"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2"> Подтвердите пароль </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--secondary)] border border-[var(--primary)]/20 focus:border-[var(--primary)] focus:outline-none transition-colors"
              placeholder="••••••••"
              required
              minLength={6}
            />
            {password && confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-sm text-red-400">Пароли не совпадают</p>
            )}
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="terms"
              className="mt-1 w-4 h-4 rounded border-[var(--primary)] bg-[var(--secondary)]"
              required
            />
            <label htmlFor="terms" className="text-sm text-[var(--text-secondary)]"> Я согласен с условиями использования </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-semibold hover:bg-[var(--primary)]/90 transition-colors"
          > Создать аккаунт </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[var(--text-secondary)] text-sm mb-2"> Уже есть аккаунт? </p>
          <Link
            href="/login"
            className="inline-block w-full py-3 rounded-xl border-2 border-[var(--primary)] text-[var(--primary)] font-semibold hover:bg-[var(--primary)] hover:text-white transition-colors"
          > Войти </Link>
        </div>
      </div>
  );
}