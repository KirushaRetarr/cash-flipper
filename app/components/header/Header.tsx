"use client"

import Image from "next/image";
import logo from "./logo.png";
import Link from "next/link";
import "./header.css";

export default function Header() {
  return (
    <header className="w-full rounded-[30px] px-[20px] py-[5px] mt-[20px] text-[18px] bg-(--background-second) backdrop-blur-[7px] flex flex-row justify-between items-center">
      <Link href="/" className="flex flex-row justify-start items-center gap-[10px]">
        <Image src={logo} alt="Logo" width={50} height={50} />
      </Link>
      <nav className="flex max-[640px]:hidden flex-row justify-center items-center gap-[30px]">
        <Link href="/">Главная</Link>
        <Link href="/bets">Ставки</Link>
        <Link href="/trading">Трейдинг</Link>
        <Link href="/login">Войти</Link>
      </nav>
      <div className="block sm:hidden">
        <input id="menu-toggle" className="opacity-0" type="checkbox" />
        <label className="menu-btn flex items-center fixed top-[20px] right-[20px] w-[26px] h-[26px] cursor-pointer z-1 " htmlFor="menu-toggle">
          <span></span>
        </label>
        <ul className="menu-box fixed invisible top-0 right-0 w-[100%] h-[100%] list-none text-end bg-(--background)">
          <Link className="menu-item mt-[60px]" href="/">Главная</Link>
          <Link className="menu-item" href="/bets">Ставки</Link>
          <Link className="menu-item" href="/trading">Трейдинг</Link>
          <Link className="menu-item" href="/login">Войти</Link>
        </ul>
      </div>
    </header>
  );
}
