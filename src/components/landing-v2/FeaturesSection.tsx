import { Image, Users, Newspaper, ShieldCheck } from "lucide-react";
import GlassCard from "./GlassCard";
import { useScrollReveal } from "./useScrollReveal";

const features = [
  {
    icon: Image,
    title: "Galeria Privada",
    description: "Compartilhe screenshots, builds e criações dos seus Sims em um espaço seguro e exclusivo.",
    emoji: "🎨",
  },
  {
    icon: Users,
    title: "Famílias & Comunidades",
    description: "Crie grupos, interaja com famílias e conecte-se com jogadores que compartilham sua paixão.",
    emoji: "👨‍👩‍👧‍👦",
  },
  {
    icon: Newspaper,
    title: "Feed Social",
    description: "Posts, reações e comentários em tempo real. Uma experiência social completa para simmers.",
    emoji: "📰",
  },
  {
    icon: ShieldCheck,
    title: "Privacidade Total",
    description: "Acesso exclusivo por convite com aprovação manual. Sua comunidade, suas regras.",
    emoji: "🔒",
  },
];

const FeaturesSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="relative py-24 px-4" id="features" ref={ref}>
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className={`text-center mb-16 ${isVisible ? 'animate-scroll-reveal' : 'opacity-0'}`}>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Por que <span className="gradient-text">SimsKut</span>?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Uma rede social feita por simmers, para simmers. Privada, elegante e cheia de recursos.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <GlassCard
              key={feature.title}
              glow
              className={`text-center ${isVisible ? 'animate-scroll-reveal' : 'opacity-0'}`}
              style={{ animationDelay: `${(i + 1) * 150}ms` }}
            >
              <div className="text-4xl mb-4">{feature.emoji}</div>
              <h3 className="font-display text-lg font-semibold mb-2 text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
