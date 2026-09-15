'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiClient } from '@/lib/api-client'; 
import { loginSchema, registerSchema, type RegisterInput } from '@/schemas/auth.schema';
import * as z from 'zod';
// Importamos la constante del nombre de la cookie
import { AUTH_COOKIE_NAME } from '@/lib/auth-cookies';

export async function loginAction(data: z.infer<typeof loginSchema>) {
  try {
    const response = await apiClient.post<{ token: string }>('/api/auth/login', data);
    
    const cookieStore = await cookies();
    
    // Usamos AUTH_COOKIE_NAME aquí
    cookieStore.set(AUTH_COOKIE_NAME, response.token, {
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

export async function registerAction(data: RegisterInput) {
  try {
    await apiClient.post('/api/auth/register', data);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Error al registrar el usuario' };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  // Usamos AUTH_COOKIE_NAME aquí también
  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect('/login');
}