import GlassCard from "./GlassCard";
import { useScrollReveal } from "./useScrollReveal";
import { Monitor, Heart, MessageCircle, Share2 } from "lucide-react";

const ShowcaseSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="relative py-24 px-4" id="showcase" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Mockup */}
          <div className={`${isVisible ? 'animate-scroll-reveal' : 'opacity-0'}`}>
            <GlassCard className="glow-border p-0 overflow-hidden">
              {/* Fake app header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-accent/60" />
                  <div className="w-3 h-3 rounded-full bg-primary/60" />
                </div>
                <span className="text-xs text-muted-foreground ml-2 font-mono">simskut.app/feed</span>
              </div>
              
              {/* Fake feed content */}
              <div className="p-5 space-y-4">
                {/* Post 1 */}
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full gradient-box" />
                    <div>
                      <div className="text-sm font-medium text-foreground">SimmerBR_Julia</div>
                      <div className="text-xs text-muted-foreground">há 2 horas</div>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 mb-3">
                    Minha família Caliente ficou incrível nessa geração! 🔥✨
                  </p>
                  <div className="w-full h-32 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <Monitor className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-muted-foreground">
                    <button className="flex items-center gap-1 text-xs hover:text-primary transition-colors">
                      <Heart className="w-4 h-4" /> 24
                    </button>
                    <button className="flex items-center gap-1 text-xs hover:text-primary transition-colors">
                      <MessageCircle className="w-4 h-4" /> 8
                    </button>
                    <button className="flex items-center gap-1 text-xs hover:text-primary transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Post 2 (partial) */}
                <div className="glass rounded-xl p-4 opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/40" />
                    <div>
                      <div className="text-sm font-medium text-foreground">PlumbobKing</div>
                      <div className="text-xs text-muted-foreground">há 5 horas</div>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/60 mt-3">
                    Construí uma mansão mid-century moderna...
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Text */}
          <div className={`${isVisible ? 'animate-scroll-reveal delay-300' : 'opacity-0'}`}>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-6">
              Uma experiência social <span className="gradient-text-blue-green">imersiva</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              Feed social, perfis personalizados, galerias de screenshots e muito mais. 
              Tudo com o visual Liquid Glass que torna cada interação única.
            </p>
            <ul className="space-y-3">
              {[
                "Feed em tempo real com posts, reações e comentários",
                "Perfis personalizáveis com avatar e bio",
                "Sistema de famílias e comunidades",
                "Notificações e mensagens diretas",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShowcaseSection;
