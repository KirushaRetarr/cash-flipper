import Image from "next/image";
import logo from "./logo.png"
import "./css/header.css"
import Link from "next/link";

export default function Header() {
  return (
    <header className="flex flex-row justify-between items-center">
      <div className="flex flex-row justify-start items-center gap-[10px]">
        <Image src={logo} alt="Logo" width={50} height={50}/>
        <p>Cash Flipper</p>
      </div>
      <nav>
        <Link href="/">
          <p>Главная</p>
        </Link>
      </nav>
    </header>
  );
}
