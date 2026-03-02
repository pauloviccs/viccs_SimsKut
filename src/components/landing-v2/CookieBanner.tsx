import { useState, useEffect } from "react";
import GlassButton from "./GlassButton";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("simskut-cookies-accepted");
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("simskut-cookies-accepted", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-hero-fade-up">
      <div className="glass-heavy glass-highlight rounded-2xl p-5">
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          🍪 Usamos cookies para melhorar sua experiência. Ao continuar navegando, você concorda com nossa política de privacidade.
        </p>
        <GlassButton variant="primary" size="default" onClick={accept} className="w-full">
          Aceitar tudo e fechar
        </GlassButton>
      </div>
    </div>
  );
};

export default CookieBanner;
