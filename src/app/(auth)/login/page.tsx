import Link from "next/link";

export default function LoginPage() {
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

      {/* Placeholder — se implementará en Fase 3 */}
      <form className="flex flex-col gap-4">
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
            placeholder="••••••••"
            className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
        <button
          type="button"
          className="w-full py-2.5 px-4 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary/90 transition-colors mt-2"
        >
          Iniciar sesión
        </button>
      </form>

      <p className="text-center text-sm text-on-surface-variant mt-6">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-primary font-semibold hover:underline">
          Regístrate gratis
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
