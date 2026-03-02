import GlassCard from "./GlassCard";
import { useScrollReveal } from "./useScrollReveal";

const newsItems = [
  {
    title: "SimsKut v2.0 — Liquid Glass Update",
    date: "28 Fev 2026",
    category: "Patch Note",
    categoryColor: "bg-primary/20 text-primary",
    excerpt: "Nova interface completa com design Liquid Glass, animações fluidas e performance otimizada. A maior atualização visual da história do SimsKut.",
  },
  {
    title: "Evento: Concurso de Builds — Março 2026",
    date: "25 Fev 2026",
    category: "Evento",
    categoryColor: "bg-accent/20 text-accent",
    excerpt: "Participe do concurso mensal de construções! Tema: 'Casa dos Sonhos'. Prêmios exclusivos para os 3 primeiros colocados.",
  },
  {
    title: "Novas Famílias: Sistema de Linhagens",
    date: "20 Fev 2026",
    category: "Novidade",
    categoryColor: "bg-secondary/20 text-secondary",
    excerpt: "Agora você pode criar árvores genealógicas completas e acompanhar a linhagem da sua família Sim através de gerações.",
  },
  {
    title: "Manutenção Programada — 5 de Março",
    date: "18 Fev 2026",
    category: "Aviso",
    categoryColor: "bg-destructive/20 text-destructive",
    excerpt: "O SimsKut ficará em manutenção das 02h às 06h (BRT) para migração de servidores e melhorias de infraestrutura.",
  },
];

const NewsSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="relative py-24 px-4" id="news" ref={ref}>
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className={`text-center mb-16 ${isVisible ? 'animate-scroll-reveal' : 'opacity-0'}`}>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Novidades & <span className="gradient-text">Atualizações</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Fique por dentro de tudo que acontece no SimsKut
          </p>
        </div>

        {/* News grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {newsItems.map((item, i) => (
            <GlassCard
              key={item.title}
              glow
              className={`cursor-pointer group ${isVisible ? 'animate-scroll-reveal' : 'opacity-0'}`}
              style={{ animationDelay: `${(i + 1) * 150}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${item.categoryColor}`}>
                  {item.category}
                </span>
                <span className="text-xs text-muted-foreground">{item.date}</span>
              </div>
              <h3 className="font-display text-lg font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.excerpt}
              </p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
