const columns = [
  { title: "Novos", tone: "#f59e0b", count: 0 },
  { title: "Aceitos", tone: "#2563eb", count: 0 },
  { title: "Em preparação", tone: "#7c3aed", count: 0 },
  { title: "Prontos", tone: "#16a34a", count: 0 },
];

export default function EmpresaPage() {
  return (
    <main style={{ minHeight: "100vh", padding: 32 }}>
      <header style={{ maxWidth: 1200, margin: "0 auto 28px" }}>
        <p style={{ color: "#64748b", margin: 0 }}>Painel da empresa</p>
        <h1 style={{ margin: "6px 0" }}>Pedidos</h1>
        <p style={{ color: "#64748b" }}>Os pedidos novos aparecerão aqui em tempo real quando conectarmos o Supabase.</p>
      </header>
      <section style={{ maxWidth: 1200, margin: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
        {columns.map((column) => (
          <article key={column.title} style={{ background: "white", borderRadius: 18, padding: 20, minHeight: 180, boxShadow: "0 8px 30px rgba(15,23,42,.06)", borderTop: `4px solid ${column.tone}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>{column.title}</strong><span>{column.count}</span>
            </div>
            <p style={{ color: "#94a3b8", marginTop: 45 }}>Nenhum pedido ainda.</p>
          </article>
        ))}
      </section>
    </main>
  );
}
