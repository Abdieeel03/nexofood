export default function CatalogPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Catálogo</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Gestiona tus categorías y productos
          </p>
        </div>
        <button
          type="button"
          className="py-2.5 px-4 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary/90 transition-colors text-sm"
        >
          + Nuevo producto
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-8 text-center">
        <span className="material-symbols-outlined text-outline mb-3" style={{ fontSize: 48 }}>
          inventory_2
        </span>
        <p className="text-on-surface-variant">
          Aún no hay productos — se implementará en la Fase 4.
        </p>
      </div>
    </div>
  );
}
