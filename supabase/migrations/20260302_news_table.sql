-- =========================================
-- Tabela de Notícias (News / Patch Notes)
-- =========================================

CREATE TABLE IF NOT EXISTS public.news (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Patch Note', 'Evento', 'Novidade', 'Aviso', 'Desafio')),
    category_color TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================
-- Políticas de Segurança (Row Level Security)
-- =========================================

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- 1. Leitura: Todos os usuários autenticados (ou anônimos, dependendo do app) podem ver as notícias
CREATE POLICY "Notícias são públicas para leitura"
    ON public.news
    FOR SELECT
    USING (true);

-- 2. Escrita (Insert): Apenas perfis com is_admin = true podem criar notícias
CREATE POLICY "Apenas admins podem criar notícias"
    ON public.news
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- 3. Edição (Update): Apenas admins
CREATE POLICY "Apenas admins podem editar notícias"
    ON public.news
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- 4. Exclusão (Delete): Apenas admins
CREATE POLICY "Apenas admins podem deletar notícias"
    ON public.news
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- INDEX para performance na busca de notícias (geralmente ordenadas por created_at)
CREATE INDEX IF NOT EXISTS idx_news_created_at ON public.news(created_at DESC);
