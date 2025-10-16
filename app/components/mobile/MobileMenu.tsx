"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MobileMenu ({ isOpen, onClose }: MobileMenuProps) {
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        }
        if (isOpen) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [isOpen, onClose]);

    return (
        <div className={`mobile-menu fixed inset-0 z-50 md:hidden pointer-events-none transition-all duration-300 ${isOpen ? "pointer-events-auto" : ""}`} ref={menuRef} aria-hidden={!isOpen}>
            <div className={`absolute inset-0 bg-black/40 transition-opacity ${ isOpen ? "opacity-100" : "opacity-0"}`}onClick={onClose}/>
            <div className={`absolute top-0 right-0 h-full w-64 bg-[var(--surface)] transform transition-transform duration-300 ${ isOpen ? "translate-x-0" : "translate-x-full" }`}/>
        </div>
    )
}