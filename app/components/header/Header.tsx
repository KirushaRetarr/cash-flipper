import Image from "next/image";
import logo from "./logo.png";
import "./css/header.css";
import Link from "next/link";

export default function Header() {
  return (
    <header className="flex flex-row justify-between items-center">
      <div>
        <Link href="/" className="flex flex-row justify-start items-center gap-[10px]">
          <Image src={logo} alt="Logo" width={50} height={50} />
          <span>Cash Flipper</span>
        </Link>
      </div>
      <nav className="flex flex-row justify-center items-center gap-[30px]">
        <Link href="/">
          <span>Главная</span>
        </Link>
        <Link href="/bets">
          <span>Ставки</span>
        </Link>
        <Link href="/trading">
          <span>Трейдинг</span>
        </Link>
        <Link href="/profile">
          <span>Профиль</span>
        </Link>
      </nav>
    </header>
  );
}
