-- =============================================
-- Post Reactions (estilo Discord)
-- Um usuário pode adicionar uma reação (emoji) ao post;
-- outros podem clicar na reação para somar ao contador.
-- =============================================

-- Tabela: post_reactions (post_id, user_id, emoji) — 1 linha por usuário por emoji por post
CREATE TABLE IF NOT EXISTS public.post_reactions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id     UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji       TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (post_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON public.post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_emoji ON public.post_reactions(post_id, emoji);

COMMENT ON TABLE public.post_reactions IS 'Reações em posts (emoji + contador por emoji). Estilo Discord.';

-- RLS
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode ler reações dos posts
CREATE POLICY "post_reactions_select_authenticated"
    ON public.post_reactions FOR SELECT
    TO authenticated
    USING (true);

-- Só pode inserir com seu user_id
CREATE POLICY "post_reactions_insert_own"
    ON public.post_reactions FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Só pode deletar a própria reação
CREATE POLICY "post_reactions_delete_own"
    ON public.post_reactions FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());
