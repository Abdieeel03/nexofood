'use client';

import { useTransition } from 'react';
import { logoutAction } from '@/lib/auth-actions';
import { Button } from './Button';

export const LogoutButton = () => {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <Button 
      variant="outline"
      size="md"
      onClick={handleLogout}
      disabled={isPending}
      className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300 cursor-pointer"
    >
      {isPending ? 'Cerrando sesión...' : 'Cerrar sesión'}
    </Button>
  );
};
