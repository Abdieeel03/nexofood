import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { MOCK_USER, NAV_LINKS } from "../constants";

type SideMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
};

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose, onLogout }) => {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-inverse-surface-dark/60 backdrop-blur-sm z-60" onClick={onClose} />}

      <aside
        className={`fixed top-0 left-0 h-full w-[85vw] max-w-[340px] bg-white z-70 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 bg-linear-to-r from-primary to-primary-container text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 font-extrabold text-lg flex items-center justify-center">
              {MOCK_USER.initials}
            </div>
            <div>
              <p className="font-extrabold">{MOCK_USER.name}</p>
              <p className="text-xs text-white/80">{MOCK_USER.email}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar menú" className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer">
            <Icon name="close" size={24} />
          </button>
        </div>

        <nav className="flex-1 flex flex-col justify-between py-4">
          <ul className="flex flex-col gap-1 px-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-on-surface hover:bg-mint-subtle hover:text-primary transition-colors"
                >
                  <Icon name={link.icon} size={22} className="text-primary" /> {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="p-4 border-t border-outline-variant/40">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-error bg-error/5 hover:bg-error/10 transition-colors cursor-pointer"
            >
              <Icon name="logout" size={20} /> Cerrar sesión
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};