import { LogoutButton } from "@/components/ui/Button";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-on-surface mb-2">Configuración</h1>
      <p className="text-on-surface-variant text-sm">
        Ajustes de tu restaurante y perfil de usuario
      </p>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-8 text-center mt-6 flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-outline mb-3" style={{ fontSize: 48 }}>
          settings
        </span>
        <p className="text-on-surface-variant mb-6">
          Configuración disponible próximamente.
        </p>
        
        {/* Agregamos el botón aquí también como alternativa */}
        <LogoutButton />
      </div>
    </div>
  );
}