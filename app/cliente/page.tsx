export default function ClientePage() {
  return (
    <main style={{ minHeight: "100vh", padding: 32 }}>
      <section style={{ maxWidth: 900, margin: "0 auto" }}>
        <p style={{ color: "#2563eb", fontWeight: 700 }}>LOJA</p>
        <h1>Faça seu pedido</h1>
        <p style={{ color: "#64748b" }}>Catálogo e checkout serão conectados ao Supabase na próxima etapa.</p>
        <div style={{ marginTop: 24, background: "white", borderRadius: 18, padding: 24 }}>
          <h2>Seu carrinho</h2>
          <p style={{ color: "#94a3b8" }}>Seu carrinho está vazio.</p>
        </div>
      </section>
    </main>
  );
}
