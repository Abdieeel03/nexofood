'use client'

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { registerSchema, type RegisterInput } from "@/schemas/auth.schema";
import { registerAction } from "@/lib/auth-actions";

export default function RegisterPage() {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Configuración de React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  // Manejador del envío
  const onSubmit = async (data: RegisterInput) => {
    setGlobalError(null);
    setSuccessMessage(null);
    
    const result = await registerAction(data);
    
    if (result.success) {
      setSuccessMessage("¡Registro exitoso! Redirigiendo al login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      setGlobalError(result.error || "Ocurrió un error al intentar registrarte.");
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-lg p-8 border border-outline-variant">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-primary tracking-tight">
          Nexofood
        </h1>
        <p className="text-on-surface-variant mt-2 text-sm">
          Crea tu cuenta y empieza a gestionar tu restaurante
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        
        {/* Campo Nombre completo */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-semibold text-on-surface mb-1">
            Nombre completo
          </label>
          <input
            id="fullName"
            type="text"
            {...register("fullName")}
            placeholder="Juan Pérez"
            className={`w-full px-4 py-2.5 rounded-lg border bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
              errors.fullName ? "border-red-500" : "border-outline-variant"
            }`}
          />
          {errors.fullName && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.fullName.message}</p>
          )}
        </div>

        {/* Campo Correo electrónico */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-on-surface mb-1">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            placeholder="tu@correo.com"
            className={`w-full px-4 py-2.5 rounded-lg border bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
              errors.email ? "border-red-500" : "border-outline-variant"
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Campo Contraseña */}
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-on-surface mb-1">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            placeholder="Mínimo 8 caracteres"
            className={`w-full px-4 py-2.5 rounded-lg border bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
              errors.password ? "border-red-500" : "border-outline-variant"
            }`}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Campo Confirmar Contraseña (Nuevo, requerido por el Schema) */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-on-surface mb-1">
            Confirmar contraseña
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            placeholder="Repite tu contraseña"
            className={`w-full px-4 py-2.5 rounded-lg border bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
              errors.confirmPassword ? "border-red-500" : "border-outline-variant"
            }`}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Campo Teléfono (Opcional) */}
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-on-surface mb-1">
            Teléfono <span className="text-outline font-normal">(opcional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            {...register("phone")}
            placeholder="+57 300 123 4567"
            className={`w-full px-4 py-2.5 rounded-lg border bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
              errors.phone ? "border-red-500" : "border-outline-variant"
            }`}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.phone.message}</p>
          )}
        </div>

        {/* Mensajes Globales de Error o Éxito */}
        {globalError && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-200">
            {globalError}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm font-medium border border-green-200">
            {successMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || successMessage !== null}
          className="flex justify-center items-center w-full py-2.5 px-4 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary/90 transition-colors mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-on-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creando cuenta...
            </>
          ) : (
            "Crear cuenta"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-on-surface-variant mt-6">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Inicia sesión
        </Link>
      </p>

      <div className="text-center mt-4">
        <Link href="/" className="text-sm text-outline hover:text-primary transition-colors">
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}