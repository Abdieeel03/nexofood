"use client";

import React, { useId, useRef, useState } from "react";
import { Alert, Button, Icon } from "@/components/ui";
import {
  canManageCatalog,
  canViewCatalog,
  getDefaultRoleHomePath,
} from "@/lib/permissions";
import { useSessionTenant } from "@/modules/app/components/SessionTenantProvider";
import { CategoriesTab } from "./CategoriesTab";
import { ProductsTab } from "./ProductsTab";
import { TaxesTab } from "./TaxesTab";

type CatalogTabId = "products" | "categories" | "taxes";

const TABS: Array<{ id: CatalogTabId; label: string; icon: string }> = [
  { id: "products", label: "Productos", icon: "lunch_dining" },
  { id: "categories", label: "Categorías", icon: "category" },
  { id: "taxes", label: "Impuestos", icon: "percent" },
];

export const CatalogManager: React.FC = () => {
  const { activeTenant, activeRole, systemRole, isLoadingTenant } =
    useSessionTenant();
  const [activeTab, setActiveTab] = useState<CatalogTabId>("products");
  const baseId = useId();
  const tabRefs = useRef<Record<CatalogTabId, HTMLButtonElement | null>>({
    products: null,
    categories: null,
    taxes: null,
  });

  const handleTabSelect = (tabId: CatalogTabId) => {
    setActiveTab(tabId);
    tabRefs.current[tabId]?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  };

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % TABS.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = TABS.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const nextTab = TABS[nextIndex];
      handleTabSelect(nextTab.id);
      tabRefs.current[nextTab.id]?.focus();
    }
  };

  if (isLoadingTenant) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true">
        <div className="h-9 w-56 rounded-xl bg-surface-container-high" />
        <div className="h-12 w-full rounded-xl bg-surface-container-high" />
        <div className="h-72 w-full rounded-2xl bg-surface-container-high" />
      </div>
    );
  }

  if (!activeTenant) {
    const isSuperAdmin = systemRole === "SUPERADMIN";
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
            Catálogo
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Administra los productos, precios promocionales, categorías e
            impuestos de tu restaurante.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-outline-variant bg-surface-card p-10 md:p-12 shadow-level-1">
          <div className="h-14 w-14 rounded-2xl bg-surface-container flex items-center justify-center text-primary mb-4">
            <Icon name="storefront" size={30} />
          </div>
          <h2 className="text-lg font-bold text-on-surface">
            {isSuperAdmin
              ? "No hay un restaurante seleccionado"
              : "Aún no tienes un restaurante activo"}
          </h2>
          <p className="mt-1.5 text-sm text-on-surface-variant max-w-md leading-relaxed">
            {isSuperAdmin
              ? "Como superadministrador sin membresía activa, puedes gestionar usuarios y planes globales o crear un restaurante para operar un catálogo."
              : "Completa la activación de tu plan y crea tu restaurante en el flujo de onboarding para comenzar a publicar productos."}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {isSuperAdmin ? (
              <>
                <Button
                  href="/admin/users"
                  variant="primary"
                  icon="group"
                  iconPosition="left"
                >
                  Ir a Usuarios
                </Button>
                <Button
                  href="/onboarding"
                  variant="outline"
                  icon="add_business"
                  iconPosition="left"
                >
                  Crear restaurante
                </Button>
              </>
            ) : (
              <Button
                href="/onboarding"
                variant="primary"
                icon="rocket_launch"
                iconPosition="left"
              >
                Completar onboarding
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!canViewCatalog(activeRole, systemRole)) {
    const fallbackHref = getDefaultRoleHomePath(activeRole, systemRole);
    return (
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
          Catálogo
        </h1>
        <Alert
          variant="danger"
          title="Acceso restringido"
          action={
            <Button href={fallbackHref} variant="outline" size="sm">
              Volver a mi inicio
            </Button>
          }
        >
          La consulta y administración del catálogo está restringida a
          propietarios y administradores de este restaurante.
        </Alert>
      </div>
    );
  }

  const canEdit = canManageCatalog(activeRole, systemRole);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
            Catálogo
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Carta, reglas promocionales, categorías e impuestos de{" "}
            <strong className="font-semibold text-on-surface">
              {activeTenant.name}
            </strong>
            .
          </p>
        </div>
      </div>

      {!canEdit && (
        <Alert variant="info" title="Vista de solo lectura">
          Tu rol actual ({activeRole ?? "Staff"}) permite consultar el catálogo,
          precios y stock disponible, pero solo los roles{" "}
          <strong>OWNER</strong> o <strong>ADMIN</strong> pueden crear o editar
          registros.
        </Alert>
      )}

      <div>
        <div
          role="tablist"
          aria-label="Secciones del catálogo"
          className="flex flex-nowrap overflow-x-auto border-b border-outline-variant/80 gap-2"
        >
          {TABS.map((tab, index) => {
            const isSelected = activeTab === tab.id;
            const tabDomId = `${baseId}-tab-${tab.id}`;

            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                id={tabDomId}
                type="button"
                role="tab"
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => handleTabSelect(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
                className={[
                  "relative shrink-0 inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap",
                  "after:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:border-b-[3px] after:transition-colors",
                  isSelected
                    ? "text-primary after:border-primary"
                    : "text-on-surface-variant hover:text-on-surface after:border-transparent",
                ].join(" ")}
              >
                <Icon name={tab.icon} size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${activeTab}`}
          className="pt-5"
        >
          {activeTab === "products" && (
            <ProductsTab tenantId={activeTenant.id} canEdit={canEdit} />
          )}
          {activeTab === "categories" && (
            <CategoriesTab tenantId={activeTenant.id} canEdit={canEdit} />
          )}
          {activeTab === "taxes" && (
            <TaxesTab tenantId={activeTenant.id} canEdit={canEdit} />
          )}
        </div>
      </div>
    </div>
  );
};
