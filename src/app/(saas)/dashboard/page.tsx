export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-on-surface mb-2">Dashboard</h1>
      <p className="text-on-surface-variant">
        Panel principal — las métricas y gráficos se implementarán en la Fase 6.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { label: "Ventas hoy", value: "$0.00", icon: "payments" },
          { label: "Pedidos hoy", value: "0", icon: "shopping_bag" },
          { label: "Productos activos", value: "0", icon: "inventory_2" },
          { label: "Clientes", value: "0", icon: "group" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>
                  {stat.icon}
                </span>
              </div>
            </div>
            <p className="text-2xl font-bold text-on-surface">{stat.value}</p>
            <p className="text-sm text-on-surface-variant mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
