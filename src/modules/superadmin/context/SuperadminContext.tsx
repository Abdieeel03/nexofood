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
import { storeKeys } from "@/modules/store/queries/keys";
import {
  userProfileResponseSchema,
  type UserProfileResponse,
} from "@/schemas/auth.schema";

export interface SuperadminContextValue {
  user: UserProfileResponse;
  refreshUser: () => Promise<void>;
}

const SuperadminContext = createContext<SuperadminContextValue | null>(null);

export interface SuperadminProviderProps {
  initialUser: UserProfileResponse;
  children: React.ReactNode;
}

export function SuperadminProvider({
  initialUser,
  children,
}: SuperadminProviderProps) {
  const queryClient = useQueryClient();
  const [prevInitialUser, setPrevInitialUser] = useState(initialUser);
  const [user, setUser] = useState<UserProfileResponse>(initialUser);

  if (initialUser !== prevInitialUser) {
    setPrevInitialUser(initialUser);
    setUser(initialUser);
  }

  useEffect(() => {
    queryClient.setQueryData(storeKeys.me, user);
  }, [queryClient, user]);

  const refreshUser = useCallback(async () => {
    const profile = await apiClient.get<UserProfileResponse>("/auth/me", {
      schema: userProfileResponseSchema,
    });
    setUser(profile);
  }, []);

  const value = useMemo<SuperadminContextValue>(
    () => ({ user, refreshUser }),
    [user, refreshUser]
  );

  return (
    <SuperadminContext.Provider value={value}>
      {children}
    </SuperadminContext.Provider>
  );
}

export function useSuperadmin(): SuperadminContextValue {
  const ctx = useContext(SuperadminContext);
  if (!ctx) {
    throw new Error(
      "useSuperadmin debe utilizarse dentro de un SuperadminProvider."
    );
  }
  return ctx;
}
