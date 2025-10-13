import Image from "next/image";
import styles from "./css/Header.module.css";

export default function Header() {
  return (
    <header className="flex flex-row justify-between items-center">
      <div className="flex flex-row justify-start items-center gap-[10px]">
        <Image src="/img/logo.png" alt="Logo" width={50} height={50}/>
        <p>Cash Flipper</p>
      </div>
    </header>
  );
}
