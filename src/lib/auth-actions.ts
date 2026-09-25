'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiClient } from '@/lib/api-client'; // Asegúrate de que esta ruta coincida con tu cliente
import { loginSchema, registerSchema } from '@/schemas/auth.schema';
import * as z from 'zod';
import { setAuthCookies, removeAuthCookies } from '@/lib/auth-cookies';

export async function loginAction(data: z.infer<typeof loginSchema>) {
  try {
    const response = await apiClient.post<{ token?: string; accessToken?: string; refreshToken?: string }>(
      '/api/auth/login',
      data
    );
    
    const token = response.token || response.accessToken;
    if (!token) {
      return { success: false, error: 'Credenciales inválidas' };
    }

    await setAuthCookies({
      accessToken: token,
      refreshToken: response.refreshToken,
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
  await removeAuthCookies();
  const cookieStore = await cookies();
  cookieStore.delete('session_token');
  redirect('/');
}
