import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { MOCK_USER, NAV_LINKS } from "../constants";

type UserMenuProps = {
  onLogout: () => void;
};

export const UserMenu: React.FC<UserMenuProps> = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Menú de usuario"
        className="w-11 h-11 rounded-full bg-mint-subtle text-primary font-extrabold text-sm flex items-center justify-center border-2 border-primary-container/40 hover:border-primary-container transition-all active:scale-95 cursor-pointer"
      >
        {MOCK_USER.initials}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-level-3 border border-outline-variant/40 py-3 z-50">
          <div className="px-5 py-3 border-b border-outline-variant/40">
            <p className="font-extrabold text-sm text-on-surface">{MOCK_USER.name}</p>
            <p className="text-xs text-on-surface-variant truncate">{MOCK_USER.email}</p>
          </div>

          <div className="p-2 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-bold text-on-surface hover:bg-mint-subtle hover:text-primary transition-colors"
              >
                <Icon name={link.icon} size={18} className="text-primary" /> {link.label}
              </Link>
            ))}
          </div>

          <div className="px-2 pt-2 border-t border-outline-variant/40">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-bold text-error hover:bg-error/10 transition-colors cursor-pointer"
            >
              <Icon name="logout" size={18} /> Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
};