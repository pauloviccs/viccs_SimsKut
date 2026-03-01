-- =============================================
-- Sims 4 Gallery Showcase (EA Gallery Sync)
-- Tabela de vitrine local das criações da EA
-- =============================================

CREATE TABLE IF NOT EXISTS public.saas_ea_showcase (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    ea_original_id   VARCHAR(100) NOT NULL,
    title            VARCHAR(255) NOT NULL,
    thumbnail_url    TEXT,
    packs_needed     JSONB,
    original_comments JSONB,
    download_count   INT,
    favorite_count   INT,
    is_published     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT saas_ea_showcase_unique_user_item UNIQUE (user_id, ea_original_id)
);

-- Índices para leitura rápida por usuário e item
CREATE INDEX IF NOT EXISTS idx_saas_ea_showcase_user
    ON public.saas_ea_showcase (user_id);

CREATE INDEX IF NOT EXISTS idx_saas_ea_showcase_user_item
    ON public.saas_ea_showcase (user_id, ea_original_id);

COMMENT ON TABLE public.saas_ea_showcase IS
    'Vitrine local de criações da The Sims 4 Gallery (cache no SaaS).';

-- RLS
ALTER TABLE public.saas_ea_showcase ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode ler a vitrine publicada de qualquer usuário
CREATE POLICY "saas_ea_showcase_select_published"
    ON public.saas_ea_showcase FOR SELECT
    TO authenticated
    USING (is_published = TRUE);

-- Usuário só pode inserir itens da própria vitrine
CREATE POLICY "saas_ea_showcase_insert_own"
    ON public.saas_ea_showcase FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Usuário só pode atualizar itens da própria vitrine
CREATE POLICY "saas_ea_showcase_update_own"
    ON public.saas_ea_showcase FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Usuário só pode deletar itens da própria vitrine
CREATE POLICY "saas_ea_showcase_delete_own"
    ON public.saas_ea_showcase FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

