import { motion } from "framer-motion";
import GlassCard from "./GlassCard";
import { useScrollReveal } from "./useScrollReveal";
import { Heart, Zap, User, Users, Bell } from "lucide-react";
import { useShowcasePosts } from "@/hooks/useShowcasePosts";

// Converte created_at em "há X horas/min" sem dependência adicional
function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  return `há ${Math.floor(diff / 86400)}d`;
}

// Retorna as URLs de imagem do post (suporta string única ou JSON array)
function getImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  const v = imageUrl.trim();
  if (v.startsWith("[")) {
    try {
      const arr = JSON.parse(v);
      return Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
    } catch {
      return v;
    }
  }
  return v;
}

// Skeleton de um post — mantém a mesma altura do post real
const PostSkeleton = () => (
  <div className="glass rounded-xl p-4 animate-pulse">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-8 h-8 rounded-full bg-white/10" />
      <div className="flex flex-col gap-1.5">
        <div className="h-3 w-24 rounded bg-white/10" />
        <div className="h-2.5 w-16 rounded bg-white/[0.06]" />
      </div>
    </div>
    <div className="h-3 w-full rounded bg-white/[0.06] mb-1.5" />
    <div className="h-3 w-3/4 rounded bg-white/[0.06] mb-3" />
    <div className="w-full h-32 rounded-lg bg-white/[0.06]" />
    <div className="flex items-center gap-4 mt-3">
      <div className="h-3 w-10 rounded bg-white/[0.06]" />
    </div>
  </div>
);

const ShowcaseSection = () => {
  const { ref, isVisible } = useScrollReveal();
  const { posts, isLoading } = useShowcasePosts(3);

  // Separa o primeiro post (destaque) dos demais (parcial)
  const [mainPost, ...secondaryPosts] = posts;

  return (
    <section className="relative py-24 px-4" id="showcase" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Mockup */}
          <div className={`${isVisible ? "animate-scroll-reveal" : "opacity-0"}`}>
            <GlassCard className="glow-border p-0 overflow-hidden">
              {/* Barra estilo browser */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-accent/60" />
                  <div className="w-3 h-3 rounded-full bg-primary/60" />
                </div>
                <span className="text-xs text-muted-foreground ml-2 font-mono">
                  simskut.app/feed
                </span>
              </div>

              {/* Feed */}
              <div className="p-5 space-y-4">
                {/* Loading state */}
                {isLoading && (
                  <>
                    <PostSkeleton />
                    <div className="opacity-60">
                      <PostSkeleton />
                    </div>
                  </>
                )}

                {/* Post principal (1º) */}
                {!isLoading && mainPost && (
                  <motion.div
                    className="glass rounded-xl p-4"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    {/* Header do post */}
                    <div className="flex items-center gap-3 mb-3">
                      {mainPost.author?.avatar_url ? (
                        <img
                          src={mainPost.author.avatar_url}
                          alt={mainPost.author.display_name ?? mainPost.author.username}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full gradient-box shrink-0" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {mainPost.author?.display_name ?? mainPost.author?.username ?? "Simmer"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {timeAgo(mainPost.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* Conteúdo textual */}
                    {mainPost.content && (
                      <p className="text-sm text-foreground/80 mb-3 line-clamp-2">
                        {mainPost.content}
                      </p>
                    )}

                    {/* Imagem do post */}
                    {getImageUrl(mainPost.image_url ?? null) && (
                      <div className="w-full h-32 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                        <img
                          src={getImageUrl(mainPost.image_url ?? null)!}
                          alt="Post"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Curtidas */}
                    <div className="flex items-center gap-4 mt-3 text-muted-foreground">
                      <span className="flex items-center gap-1 text-xs">
                        <Heart className="w-4 h-4" />
                        {mainPost.likes_count ?? 0}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Posts secundários (2º e 3º) — parcialmente visíveis */}
                {!isLoading && secondaryPosts.map((post, i) => {
                  const isLast = i === secondaryPosts.length - 1;
                  return (
                    <motion.div
                      key={post.id}
                      className={`glass rounded-xl p-4 ${isLast ? "opacity-60" : ""}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: isLast ? 0.6 : 1, y: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut", delay: (i + 1) * 0.1 }}
                    >
                      <div className="flex items-center gap-3">
                        {post.author?.avatar_url ? (
                          <img
                            src={post.author.avatar_url}
                            alt={post.author.display_name ?? post.author.username}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-accent/40 shrink-0" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {post.author?.display_name ?? post.author?.username ?? "Simmer"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {timeAgo(post.created_at)}
                          </div>
                        </div>
                      </div>

                      {post.content && (
                        <p className="text-sm text-foreground/60 mt-3 line-clamp-1">
                          {post.content}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </GlassCard>
          </div>

          {/* Texto lateral */}
          <div className={`${isVisible ? "animate-scroll-reveal delay-300" : "opacity-0"}`}>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-6">
              Uma experiência social{" "}
              <span className="gradient-text-blue-green">imersiva</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              Feed social, perfis personalizados, galerias de screenshots e muito mais.
              Tudo com o visual Liquid Glass que torna cada interação única.
            </p>
            <ul className="space-y-4">
              {[
                { icon: Zap, text: "Feed em tempo real com posts, reações e comentários" },
                { icon: User, text: "Perfis personalizáveis com avatar e bio" },
                { icon: Users, text: "Sistema de famílias e comunidades" },
                { icon: Bell, text: "Notificações e mensagens diretas" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-foreground/80">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </span>
                  {text}
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
