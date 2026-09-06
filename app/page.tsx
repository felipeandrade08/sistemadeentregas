export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ maxWidth: 900, width: "100%", background: "white", borderRadius: 24, padding: 48, boxShadow: "0 20px 60px rgba(15,23,42,.08)" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#2563eb" }}>ENTREGAOS</span>
        <h1 style={{ fontSize: "clamp(38px, 7vw, 72px)", lineHeight: 1.02, margin: "14px 0" }}>Pedidos simples. Entregas organizadas.</h1>
        <p style={{ fontSize: 19, lineHeight: 1.6, color: "#64748b", maxWidth: 680 }}>
          Uma plataforma para empresas receberem pedidos, aceitarem, prepararem e acompanharem cada entrega em tempo real.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
          <a href="/empresa" style={{ background: "#2563eb", color: "white", padding: "14px 20px", borderRadius: 12, fontWeight: 700 }}>Painel da empresa</a>
          <a href="/cliente" style={{ border: "1px solid #dbe2ea", padding: "14px 20px", borderRadius: 12, fontWeight: 700 }}>Fazer pedido</a>
        </div>
      </section>
    </main>
  );
}
