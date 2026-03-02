import { useState } from "react";
import GlassCard from "./GlassCard";
import { useScrollReveal } from "./useScrollReveal";
import { useQuery } from "@tanstack/react-query";
import { newsService } from "@/lib/newsService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { News } from "@/types";
import { ReadNewsModal } from "./ReadNewsModal";

const categoryColors: Record<string, string> = {
  "Patch Note": "bg-primary/20 text-primary",
  "Evento": "bg-accent/20 text-accent",
  "Novidade": "bg-secondary/20 text-secondary",
  "Aviso": "bg-destructive/20 text-destructive",
  "Desafio": "bg-orange-500/20 text-orange-500"
};

const NewsSection = () => {
  const { ref, isVisible } = useScrollReveal();
  const [selectedNews, setSelectedNews] = useState<News | null>(null);

  const { data: newsItems = [], isLoading } = useQuery({
    queryKey: ['public-news'],
    queryFn: () => newsService.getNews(4),
  });

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
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <GlassCard key={i} className="animate-pulse h-[140px]">
                <div className="flex justify-between mb-3">
                  <div className="h-6 w-20 bg-white/10 rounded-full"></div>
                  <div className="h-4 w-24 bg-white/5 rounded-full mt-1"></div>
                </div>
                <div className="h-6 w-3/4 bg-white/10 rounded-full mb-3"></div>
                <div className="h-4 w-full bg-white/5 rounded-full mb-1"></div>
                <div className="h-4 w-2/3 bg-white/5 rounded-full"></div>
              </GlassCard>
            ))
          ) : newsItems.length === 0 ? (
            <div className="col-span-full py-12 text-center text-white/50">
              Nenhuma novidade no momento. Logo traremos atualizações!
            </div>
          ) : (
            newsItems.map((item, i) => (
              <GlassCard
                key={item.id}
                glow
                onClick={() => setSelectedNews(item)}
                className={`cursor-pointer group flex flex-col ${isVisible ? 'animate-scroll-reveal' : 'opacity-0'}`}
                style={{ animationDelay: `${(i + 1) * 150}ms` }}
              >
                {item.image_url && (
                  <div className="-mt-6 -mx-6 mb-6 h-48 overflow-hidden rounded-t-2xl relative">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${categoryColors[item.category] || 'bg-white/10 text-white'}`}>
                    {item.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(item.created_at), "dd MMM yyyy", { locale: ptBR })}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <div
                  className="text-sm text-muted-foreground leading-relaxed line-clamp-4 prose prose-invert prose-p:my-1 prose-a:text-primary hover:prose-a:underline prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: item.excerpt }}
                />
              </GlassCard>
            ))
          )}
        </div>
      </div>

      <ReadNewsModal
        isOpen={!!selectedNews}
        onClose={() => setSelectedNews(null)}
        news={selectedNews}
      />
    </section>
  );
};

export default NewsSection;
