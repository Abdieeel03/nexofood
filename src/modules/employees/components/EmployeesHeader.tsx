"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export interface EmployeesHeaderProps {
  tenantName: string;
  onAddMember: () => void;
  onRefresh: () => void;
  isFetching: boolean;
  canAdd: boolean;
}

export function EmployeesHeader({
  tenantName,
  onAddMember,
  onRefresh,
  isFetching,
  canAdd,
}: EmployeesHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface">
          Equipo e Invitaciones
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant flex items-center gap-2">
          <Icon name="storefront" size={16} className="text-primary" />
          <span>
            Administración de staff e invitaciones por correo en {tenantName}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon="refresh"
          iconPosition="left"
          isLoading={isFetching}
          onClick={onRefresh}
        >
          Actualizar
        </Button>

        {canAdd && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon="mail"
            iconPosition="left"
            onClick={onAddMember}
          >
            Invitar por correo
          </Button>
        )}
      </div>
    </header>
  );
}
