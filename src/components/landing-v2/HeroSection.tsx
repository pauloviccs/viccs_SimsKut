import { motion } from "framer-motion";
import { LogIn, UserPlus, LayoutDashboard } from "lucide-react";
import GlassButton from "./GlassButton";

interface HeroSectionProps {
  onRegister?: () => void;
  onLogin?: () => void;
  onDashboard?: () => void;
  isLoggedIn?: boolean;
}

const HeroSection = ({ onRegister, onLogin, onDashboard, isLoggedIn }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
      <div className="text-center max-w-3xl mx-auto relative z-10">
        {/* Logo Icon */}
        <div className="animate-logo-enter mb-8 inline-flex">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg animate-pulse-glow">
            <img
              src="/android-chrome-512x512.png"
              alt="SimsKut"
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="animate-hero-fade-up delay-200 font-display text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight mb-4">
          Sims<span className="gradient-text-blue-green">Kut</span>
        </h1>

        {/* Subtitle */}
        <p className="animate-hero-fade-up delay-300 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-6 font-light">
          Rede social privada para comunidades de The Sims
        </p>

        {/* Badge */}
        <div className="animate-hero-fade-up delay-400 mb-10">
          <span className="glass inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs text-muted-foreground tracking-wide uppercase">
            🔒 Acesso exclusivo por convite</span>
        </div>

        {/* CTA Buttons — estado condicional */}
        <div className="animate-hero-fade-up delay-500 flex flex-col sm:flex-row gap-4 justify-center">
          {isLoggedIn ? (
            // Usuário logado → botão único com borda Liquid Glass sutil
            <GlassButton
              variant="secondary"
              size="lg"
              onClick={onDashboard}
              className="border border-white/20 bg-white/[0.06] hover:bg-white/[0.10] hover:border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.10)] backdrop-blur-md"
            >
              <LayoutDashboard className="w-5 h-5" />
              Entrar no SimsKut
            </GlassButton>
          ) : (
            // Visitante → dois botões padrão
            <>
              <GlassButton variant="primary" size="lg" onClick={onRegister}>
                <UserPlus className="w-5 h-5" />
                Criar Conta
              </GlassButton>
              <GlassButton variant="secondary" size="lg" onClick={onLogin}>
                <LogIn className="w-5 h-5" />
                Entrar
              </GlassButton>
            </>
          )}
        </div>

        {/*
          Scroll hint — wrapper com CSS animation de entrada (opacity/transform),
          motion.div interno com loop Framer Motion (y flutuante).
          Separados para não conflitarem.
        */}
        <div className="animate-hero-fade-up delay-800 mt-16">
          <motion.div
            className="flex flex-col items-center"
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-6 h-10 rounded-full border border-white/25 mx-auto flex justify-center pt-2">
              <motion.div
                className="w-1 h-2 rounded-full bg-white/40"
                animate={{ opacity: [0.8, 0.1, 0.8], y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
