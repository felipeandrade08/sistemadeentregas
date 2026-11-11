"use client";

import { useEffect, useState, type CSSProperties } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const buttonStyle: CSSProperties = {
  border: "1px solid rgba(53,217,245,.55)",
  borderRadius: 12,
  padding: "13px 18px",
  background: "rgba(53,217,245,.10)",
  color: "#35D9F5",
  fontWeight: 800,
  cursor: "pointer",
};

export default function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent));

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  if (installPrompt) {
    return (
      <button type="button" style={buttonStyle} onClick={async () => {
        await installPrompt.prompt();
        await installPrompt.userChoice;
        setInstallPrompt(null);
      }}>
        Instalar aplicativo
      </button>
    );
  }

  if (isIos) {
    return (
      <button type="button" style={buttonStyle} onClick={() => window.alert(
        "Para instalar o EntregaOS no iPhone: toque em Compartilhar no Safari e escolha 'Adicionar à Tela de Início'."
      )}>
        Como instalar no iPhone
      </button>
    );
  }

  return null;
}
