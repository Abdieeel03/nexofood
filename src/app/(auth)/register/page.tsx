import Link from "next/link";

export default function RegisterPage() {
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

      {/* Placeholder — se implementará en Fase 3 */}
      <form className="flex flex-col gap-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-semibold text-on-surface mb-1">
            Nombre completo
          </label>
          <input
            id="fullName"
            type="text"
            placeholder="Juan Pérez"
            className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-on-surface mb-1">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            placeholder="tu@correo.com"
            className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-on-surface mb-1">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-on-surface mb-1">
            Teléfono <span className="text-outline font-normal">(opcional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="+57 300 123 4567"
            className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
        <button
          type="button"
          className="w-full py-2.5 px-4 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary/90 transition-colors mt-2"
        >
          Crear cuenta
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
