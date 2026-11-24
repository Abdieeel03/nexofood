"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getEffectiveTenantRole } from "@/lib/permissions";
import { storeKeys } from "@/modules/store/queries/keys";
import {
  userProfileResponseSchema,
  type UserProfileResponse,
} from "@/schemas/auth.schema";
import type {
  TenantStaffRole,
  UserSystemRole,
} from "@/schemas/common.schema";
import {
  tenantResponseSchema,
  type TenantResponse,
} from "@/schemas/tenant.schema";

const ACTIVE_TENANT_STORAGE_KEY = "nexofood_active_tenant_id";

export interface SessionTenantContextValue {
  user: UserProfileResponse;
  activeTenant: TenantResponse | null;
  activeRole: TenantStaffRole | null; // derived from user.staffMemberships matching activeTenant?.id
  systemRole: UserSystemRole; // user.systemRole
  isLoadingTenant: boolean;
  switchTenant: (tenantId: string) => Promise<void>; // calls GET /tenants/{id}
  refreshTenant: () => Promise<void>;
  refreshUser: () => Promise<void>; // calls GET /auth/me
  setActiveTenant: (tenant: TenantResponse | null) => void;
}

const SessionTenantContext = createContext<SessionTenantContextValue | null>(
  null
);

export interface SessionTenantProviderProps {
  initialUser: UserProfileResponse;
  initialTenant: TenantResponse | null;
  children: React.ReactNode;
}

function readStoredTenantId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(ACTIVE_TENANT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredTenantId(tenantId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (tenantId) {
      window.sessionStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, tenantId);
    } else {
      window.sessionStorage.removeItem(ACTIVE_TENANT_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors in restricted browsing modes
  }
}

export function SessionTenantProvider({
  initialUser,
  initialTenant,
  children,
}: SessionTenantProviderProps) {
  const queryClient = useQueryClient();
  const [prevInitialUser, setPrevInitialUser] = useState(initialUser);
  const [prevInitialTenant, setPrevInitialTenant] = useState(initialTenant);
  const [user, setUser] = useState<UserProfileResponse>(initialUser);
  const [activeTenantState, setActiveTenantState] =
    useState<TenantResponse | null>(initialTenant);
  const [isLoadingTenant, setIsLoadingTenant] = useState(false);

  // Mantener sincronizada la sesión del panel SaaS con la caché de React Query del storefront
  useEffect(() => {
    queryClient.setQueryData(storeKeys.me, user);
  }, [queryClient, user]);

  if (initialUser !== prevInitialUser) {
    setPrevInitialUser(initialUser);
    setUser(initialUser);
  }

  if (initialTenant !== prevInitialTenant) {
    setPrevInitialTenant(initialTenant);
    setActiveTenantState(initialTenant);
  }

  const setActiveTenant = useCallback((tenant: TenantResponse | null) => {
    setActiveTenantState(tenant);
    writeStoredTenantId(tenant?.id ?? null);
  }, []);

  const switchTenant = useCallback(async (tenantId: string) => {
    setIsLoadingTenant(true);
    try {
      const tenant = await apiClient.get<TenantResponse>(
        `/tenants/${encodeURIComponent(tenantId)}`,
        { schema: tenantResponseSchema }
      );
      setActiveTenantState(tenant);
      writeStoredTenantId(tenant.id);
    } finally {
      setIsLoadingTenant(false);
    }
  }, []);

  const refreshTenant = useCallback(async () => {
    setIsLoadingTenant(true);
    try {
      const currentId = activeTenantState?.id;
      if (currentId) {
        const tenant = await apiClient.get<TenantResponse>(
          `/tenants/${encodeURIComponent(currentId)}`,
          { schema: tenantResponseSchema }
        );
        setActiveTenantState(tenant);
        writeStoredTenantId(tenant.id);
        return;
      }

      try {
        const tenant = await apiClient.get<TenantResponse>("/tenants/me", {
          schema: tenantResponseSchema,
        });
        setActiveTenantState(tenant);
        writeStoredTenantId(tenant.id);
      } catch (err) {
        if (
          err &&
          typeof err === "object" &&
          "status" in err &&
          (err as { status: number }).status === 404
        ) {
          setActiveTenantState(null);
          writeStoredTenantId(null);
          return;
        }
        throw err;
      }
    } finally {
      setIsLoadingTenant(false);
    }
  }, [activeTenantState?.id]);

  const refreshUser = useCallback(async () => {
    const profile = await apiClient.get<UserProfileResponse>("/auth/me", {
      schema: userProfileResponseSchema,
    });
    setUser(profile);
  }, []);

  // Restaura selección previa en sessionStorage si es un restaurante permitido
  useEffect(() => {
    let cancelled = false;

    const restoreStoredTenant = async () => {
      const storedId = readStoredTenantId();
      if (!storedId) {
        if (initialTenant?.id) {
          writeStoredTenantId(initialTenant.id);
        }
        return;
      }

      if (storedId === initialTenant?.id) return;

      const isMember = initialUser.staffMemberships.some(
        (m) => m.tenantId === storedId
      );
      const canSwitch = isMember || initialUser.systemRole === "SUPERADMIN";

      if (!canSwitch) {
        writeStoredTenantId(initialTenant?.id ?? null);
        return;
      }

      await Promise.resolve();
      if (cancelled) return;

      setIsLoadingTenant(true);
      try {
        const tenant = await apiClient.get<TenantResponse>(
          `/tenants/${encodeURIComponent(storedId)}`,
          { schema: tenantResponseSchema }
        );
        if (!cancelled) {
          setActiveTenantState(tenant);
        }
      } catch {
        if (!cancelled) {
          writeStoredTenantId(initialTenant?.id ?? null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTenant(false);
        }
      }
    };

    void restoreStoredTenant();

    return () => {
      cancelled = true;
    };
  }, [initialTenant, initialUser.staffMemberships, initialUser.systemRole]);

  const activeRole = useMemo(
    () => getEffectiveTenantRole(user, activeTenantState?.id),
    [user, activeTenantState?.id]
  );

  const value = useMemo<SessionTenantContextValue>(
    () => ({
      user,
      activeTenant: activeTenantState,
      activeRole,
      systemRole: user.systemRole,
      isLoadingTenant,
      switchTenant,
      refreshTenant,
      refreshUser,
      setActiveTenant,
    }),
    [
      user,
      activeTenantState,
      activeRole,
      isLoadingTenant,
      switchTenant,
      refreshTenant,
      refreshUser,
      setActiveTenant,
    ]
  );

  return (
    <SessionTenantContext.Provider value={value}>
      {children}
    </SessionTenantContext.Provider>
  );
}

export function useSessionTenant(): SessionTenantContextValue {
  const ctx = useContext(SessionTenantContext);
  if (!ctx) {
    throw new Error(
      "useSessionTenant debe utilizarse dentro de un SessionTenantProvider."
    );
  }
  return ctx;
}
