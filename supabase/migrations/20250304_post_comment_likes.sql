-- =============================================
-- Post Comment Likes
-- Permite curtir comentários de posts do feed.
-- =============================================

CREATE TABLE IF NOT EXISTS public.post_comment_likes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id  UUID NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT post_comment_likes_unique_comment_user UNIQUE (comment_id, user_id)
);

-- Índices para leitura rápida
CREATE INDEX IF NOT EXISTS idx_post_comment_likes_comment
    ON public.post_comment_likes (comment_id);

CREATE INDEX IF NOT EXISTS idx_post_comment_likes_user
    ON public.post_comment_likes (user_id);

COMMENT ON TABLE public.post_comment_likes IS
    'Curtidas em comentários de posts do feed.';

-- RLS
ALTER TABLE public.post_comment_likes ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode ler likes de comentários
CREATE POLICY "post_comment_likes_select_authenticated"
    ON public.post_comment_likes FOR SELECT
    TO authenticated
    USING (true);

-- Só pode inserir like com seu próprio user_id
CREATE POLICY "post_comment_likes_insert_own"
    ON public.post_comment_likes FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Só pode remover o próprio like
CREATE POLICY "post_comment_likes_delete_own"
    ON public.post_comment_likes FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

