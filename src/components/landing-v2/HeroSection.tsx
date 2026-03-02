import { Sparkles, LogIn, UserPlus } from "lucide-react";
import GlassButton from "./GlassButton";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
      <div className="text-center max-w-3xl mx-auto relative z-10">
        {/* Logo Icon */}
        <div className="animate-logo-enter mb-8 inline-flex">
          <div className="gradient-box w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg animate-pulse-glow">
            <Sparkles className="w-10 h-10 text-white" />
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
            🔒 Acesso exclusivo por convite • Aprovação manual
          </span>
        </div>

        {/* CTA Buttons */}
        <div className="animate-hero-fade-up delay-500 flex flex-col sm:flex-row gap-4 justify-center">
          <GlassButton variant="primary" size="lg">
            <UserPlus className="w-5 h-5" />
            Criar Conta
          </GlassButton>
          <GlassButton variant="secondary" size="lg">
            <LogIn className="w-5 h-5" />
            Entrar
          </GlassButton>
        </div>

        {/* Scroll hint */}
        <div className="animate-hero-fade-up delay-800 mt-16">
          <div className="w-6 h-10 rounded-full border border-muted-foreground/30 mx-auto flex justify-center pt-2">
            <div className="w-1 h-2 rounded-full bg-muted-foreground/50 animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
