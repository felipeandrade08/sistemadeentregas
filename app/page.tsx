import InstallAppButton from "./install-app-button";

export default function Home() {
  return (
    <main style={{
      minHeight: "100svh",
      display: "grid",
      placeItems: "center",
      padding: "32px 20px",
      color: "#F4F8FC",
      background: "radial-gradient(ellipse at 78% 8%, rgba(53,217,245,.16), transparent 34%), linear-gradient(145deg, #111A22 0%, #142633 58%, #111A22 100%)"
    }}>
      <section style={{
        width: "min(100%, 1040px)",
        padding: "clamp(28px, 6vw, 64px)",
        border: "1px solid rgba(166,203,220,.16)",
        borderRadius: 30,
        background: "linear-gradient(145deg, rgba(26,41,52,.94), rgba(17,26,34,.92))",
        boxShadow: "0 30px 100px rgba(0,0,0,.28)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#35D9F5", fontWeight: 900, letterSpacing: ".14em", fontSize: 13 }}>
          <span style={{ display: "grid", placeItems: "center", width: 42, height: 42, borderRadius: 13, background: "#35D9F5", color: "#111A22", fontSize: 23, letterSpacing: 0 }}>E</span>
          ENTREGAOS
          <span style={{ marginLeft: "auto", border: "1px solid rgba(53,217,245,.3)", borderRadius: 999, padding: "7px 11px", fontSize: 10, letterSpacing: ".1em" }}>GESTÃO INTELIGENTE</span>
        </div>

        <div style={{ maxWidth: 760, paddingTop: "clamp(48px, 8vw, 88px)" }}>
          <p style={{ color: "#35D9F5", fontSize: 12, fontWeight: 900, letterSpacing: ".18em", margin: "0 0 18px" }}>PEDIDOS, OPERAÇÃO E ENTREGA EM UM SÓ LUGAR</p>
          <h1 style={{ fontSize: "clamp(42px, 7vw, 76px)", lineHeight: .99, letterSpacing: "-.065em", margin: 0 }}>
            Seu comércio em movimento. <span style={{ color: "#35D9F5" }}>Suas entregas sob controle.</span>
          </h1>
          <p style={{ color: "#B7C7D4", fontSize: "clamp(16px, 2vw, 19px)", lineHeight: 1.75, maxWidth: 660, margin: "24px 0 0" }}>
            Receba pedidos, organize sua equipe e acompanhe cada entrega com uma plataforma simples, profissional e pronta para funcionar no computador ou no celular.
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginTop: 34 }}>
          <a href="/empresa" style={{ display: "inline-flex", justifyContent: "center", padding: "14px 20px", borderRadius: 12, background: "#35D9F5", color: "#111A22", fontWeight: 900 }}>
            Acessar painel da empresa
          </a>
          <a href="/cliente" style={{ display: "inline-flex", justifyContent: "center", padding: "13px 19px", borderRadius: 12, border: "1px solid rgba(183,199,212,.3)", color: "#F4F8FC", fontWeight: 800 }}>
            Área do cliente
          </a>
          <InstallAppButton />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginTop: 54 }}>
          {[
            ["01", "Pedidos organizados", "Acompanhe cada etapa do atendimento."],
            ["02", "Equipe conectada", "Empresa e entregadores na mesma operação."],
            ["03", "Acesso pelo celular", "Instale o EntregaOS na tela inicial."]
          ].map(([number, title, description]) => (
            <article key={number} style={{ padding: 18, borderRadius: 16, border: "1px solid rgba(166,203,220,.13)", background: "rgba(255,255,255,.025)" }}>
              <span style={{ color: "#35D9F5", fontSize: 12, fontWeight: 900 }}>{number}</span>
              <h2 style={{ fontSize: 15, margin: "12px 0 6px" }}>{title}</h2>
              <p style={{ color: "#91A6B4", fontSize: 13, lineHeight: 1.55, margin: 0 }}>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <p style={{ color: "#718694", fontSize: 12, margin: "22px 0 0" }}>ENTREGAOS · Tecnologia para sua operação crescer.</p>
    </main>
  );
}
