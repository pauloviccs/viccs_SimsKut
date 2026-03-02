-- =========================================
-- Tabelas e Interações de Notícias (Likes e Comentários)
-- =========================================

-- 1. Tabela: news_likes
CREATE TABLE IF NOT EXISTS public.news_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Previne que um usuário curta a mesma notícia múltiplas vezes
    UNIQUE (news_id, user_id)
);

-- Habilitar RLS em news_likes
ALTER TABLE public.news_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_likes_select_public"
    ON public.news_likes FOR SELECT
    USING (true);

CREATE POLICY "news_likes_insert_own"
    ON public.news_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "news_likes_delete_own"
    ON public.news_likes FOR DELETE
    USING (auth.uid() = user_id);


-- 2. Tabela: news_comments
CREATE TABLE IF NOT EXISTS public.news_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em news_comments
ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_comments_select_public"
    ON public.news_comments FOR SELECT
    USING (true);

CREATE POLICY "news_comments_insert_own"
    ON public.news_comments FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "news_comments_delete_own_or_admin"
    ON public.news_comments FOR DELETE
    USING (
        auth.uid() = author_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Indexes para melhorar as buscas (normalmente buscadas por news_id)
CREATE INDEX IF NOT EXISTS idx_news_likes_news_id ON public.news_likes(news_id);
CREATE INDEX IF NOT EXISTS idx_news_comments_news_id ON public.news_comments(news_id);
