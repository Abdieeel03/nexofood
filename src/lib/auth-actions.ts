'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiClient } from '@/lib/api-client'; // Asegúrate de que esta ruta coincida con tu cliente
import { loginSchema, registerSchema } from '@/schemas/auth.schema';
import * as z from 'zod';

export async function loginAction(data: z.infer<typeof loginSchema>) {
  try {
    const response = await apiClient.post<{ token: string }>('/api/auth/login', data);
    
    // 1. Esperamos a que se resuelva la promesa de cookies()
    const cookieStore = await cookies();
    
    // 2. Usamos el set en la variable resuelta
    cookieStore.set('session_token', response.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Credenciales inválidas' };
  }
}

export async function registerAction(data: z.infer<typeof registerSchema>) {
  try {
    await apiClient.post('/api/auth/register', data);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Error al registrar el usuario' };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('session_token');
  redirect('/login');
}
