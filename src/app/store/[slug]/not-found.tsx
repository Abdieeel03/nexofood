import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export default function StoreNotFoundPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5">
      <div className="w-16 h-16 rounded-full bg-surface-container text-primary flex items-center justify-center mx-auto">
        <Icon name="store_mall_directory" size={34} />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
          Restaurante no encontrado
        </h1>
        <p className="text-sm text-on-surface-variant">
          El slug de tienda que ingresaste no existe o no está disponible en este
          momento.
        </p>
      </div>
      <Link
        href="/store"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-on-primary-fixed-variant transition-colors"
      >
        <Icon name="search" size={18} />
        <span>Buscar otro restaurante</span>
      </Link>
    </div>
  );
}
