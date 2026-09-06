import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EntregaOS — Gestão de pedidos",
  description: "SaaS de pedidos e entregas para empresas.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
