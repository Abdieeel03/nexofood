'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import { loginSchema, registerSchema } from '@/schemas/auth.schema';
import * as z from 'zod';
import { setAuthCookies, removeAuthCookies } from '@/lib/auth-cookies';

export async function loginAction(data: z.infer<typeof loginSchema>) {
  try {
    const response = await apiServer.post<{ token?: string; accessToken?: string; refreshToken?: string }>(
      '/api/auth/login',
      data
    );
    
    const token = response.token || response.accessToken;
    if (!token) {
      return { success: false, error: 'Credenciales inválidas' };
    }

    if (!response.refreshToken) {
      return { success: false, error: 'Respuesta de autenticación inválida' };
    }

    await setAuthCookies({
      accessToken: token,
      refreshToken: response.refreshToken,
    });

    const cookieStore = await cookies();
    cookieStore.set('nexofood_customer_scope', data.email.trim().toLowerCase(), {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Credenciales inválidas' };
  }
}

export async function registerAction(data: z.infer<typeof registerSchema>) {
  try {
    await apiServer.post('/api/auth/register', data);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Error al registrar el usuario' };
  }
}

export async function logoutAction() {
  await removeAuthCookies();
  const cookieStore = await cookies();
  cookieStore.delete('session_token');
  cookieStore.delete('nexofood_customer_scope');
  redirect('/');
}
