export default function OrdersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-on-surface mb-2">Pedidos</h1>
      <p className="text-on-surface-variant text-sm">
        Visualiza y gestiona los pedidos de tu restaurante
      </p>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-8 text-center mt-6">
        <span className="material-symbols-outlined text-outline mb-3" style={{ fontSize: 48 }}>
          receipt_long
        </span>
        <p className="text-on-surface-variant">
          No hay pedidos aún — se implementará en la Fase 5.
        </p>
      </div>
    </div>
  );
}
