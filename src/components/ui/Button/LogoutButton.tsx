'use client'

import { useTransition } from 'react';
import { logoutAction } from '@/lib/auth-actions';
import { Button } from './Button'; // Importamos tu componente visual

export const LogoutButton = () => {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <Button 
      variant="outline" // o "ghost", dependiendo de dónde lo coloques visualmente
      size="md"
      onClick={handleLogout}
      disabled={isPending}
      // Puedes inyectarle clases adicionales si quieres que el texto sea rojo, por ejemplo:
      className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
    >
      {isPending ? 'Cerrando sesión...' : 'Cerrar sesión'}
    </Button>
  );
};