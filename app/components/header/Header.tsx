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
      <nav className="flex flex-row justify-center items-center gap-[30px]">
        <Link href="/">Главная</Link>
        <Link href="/bets">Ставки</Link>
        <Link href="/trading">Трейдинг</Link>
        <Link href="/profile">Профиль</Link>
      </nav>
    </header>
  );
}
