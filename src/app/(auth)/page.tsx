'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { loginSchema, type LoginInput } from "@/schemas/auth.schema";
import { loginAction } from "@/lib/auth-actions";

export default function LoginPage() {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Configuración de React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // Manejador del envío
  const onSubmit = async (data: LoginInput) => {
    setGlobalError(null);
    
    const result = await loginAction(data);
    
    if (result.success) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setGlobalError(result.error || 'Ocurrió un error inesperado al iniciar sesión.');
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-lg p-8 border border-outline-variant">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-primary tracking-tight">
          Nexofood
        </h1>
        <p className="text-on-surface-variant mt-2 text-sm">
          Inicia sesión para acceder a tu panel
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-on-surface mb-1">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            placeholder="tu@correo.com"
            className={`w-full px-4 py-2.5 rounded-lg border bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
              errors.email ? "border-red-500" : "border-outline-variant"
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.email.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-on-surface mb-1">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            {...register('password')}
            placeholder="••••••••"
            className={`w-full px-4 py-2.5 rounded-lg border bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
              errors.password ? "border-red-500" : "border-outline-variant"
            }`}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Error global (ej: credenciales inválidas) */}
        {globalError && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-200">
            {globalError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex justify-center items-center w-full py-2.5 px-4 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary/90 transition-colors mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-on-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Ingresando...
            </>
          ) : (
            "Iniciar sesión"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-on-surface-variant mt-6">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-primary font-semibold hover:underline">
          Regístrate gratis
        </Link>
      </p>
    </div>
  );
}
