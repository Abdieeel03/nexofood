'use client'

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { MOCK_USER } from "../Header/constants";

const inputClass =
  "w-full rounded-xl bg-white border border-outline-variant px-4 py-3 text-sm font-medium text-on-surface placeholder:text-on-surface-variant outline-none transition-all focus:border-primary-container focus:ring-4 focus:ring-primary-container/15 read-only:bg-surface-container-low read-only:text-on-surface-variant";

const labelClass = "block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2";

export const AccountView: React.FC = () => {
  // TODO: cargar y guardar con el API (PUT /api/auth/users/{id})
  const [fullName, setFullName] = useState(MOCK_USER.name);
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  return (
    <div className="w-full max-w-2xl">
      <h3 className="text-2xl font-extrabold text-on-surface tracking-tight">Mi cuenta</h3>
      <p className="text-sm text-on-surface-variant mt-1 mb-8">Actualiza tus datos personales.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label htmlFor="account-name" className={labelClass}>
            Nombre completo
          </label>
          <input
            id="account-name"
            type="text"
            value={fullName}
            maxLength={150}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="account-email" className={labelClass}>
            Correo electrónico
          </label>
          <input id="account-email" type="email" value={MOCK_USER.email} readOnly className={inputClass} />
        </div>

        <div>
          <label htmlFor="account-phone" className={labelClass}>
            Teléfono
          </label>
          <input
            id="account-phone"
            type="tel"
            value={phone}
            maxLength={20}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+51 999 999 999"
            className={inputClass}
          />
        </div>

        <div className="flex items-center gap-4">
          <Button type="submit" size="lg">
            Guardar cambios
          </Button>
          {saved && (
            <p role="status" className="flex items-center gap-1.5 text-sm font-semibold text-primary">
              <Icon name="check_circle" size={20} fill /> Cambios guardados
            </p>
          )}
        </div>
      </form>
    </div>
  );
};
