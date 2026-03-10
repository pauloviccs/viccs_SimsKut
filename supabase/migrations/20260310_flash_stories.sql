-- =============================================
-- SIMSKUT — Flash Stories System
-- Migration: 20260310_flash_stories.sql
-- =============================================

-- ╔══════════════════════════════════════════════╗
-- ║  STORAGE BUCKET: flashes                    ║
-- ║  Imagens dos Flashes (públicas)             ║
-- ╚══════════════════════════════════════════════╝

INSERT INTO storage.buckets (id, name, public)
VALUES ('flashes', 'flashes', true)
ON CONFLICT (id) DO NOTHING;

-- Política de upload: autenticado, na própria pasta
CREATE POLICY "flashes_upload" ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'flashes' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Política de leitura: público (imagens são públicas como posts)
CREATE POLICY "flashes_read" ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'flashes');

-- Política de delete: só o dono
CREATE POLICY "flashes_delete" ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'flashes' AND (storage.foldername(name))[1] = auth.uid()::text);


-- ╔══════════════════════════════════════════════╗
-- ║  TABELA: flashes                            ║
-- ║  Cada flash publicado por um usuário        ║
-- ╚══════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.flashes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_url       TEXT NOT NULL,
    caption         TEXT,                        -- Legenda opcional (max 150 chars)
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_flashes_author     ON public.flashes(author_id);
CREATE INDEX IF NOT EXISTS idx_flashes_expires_at ON public.flashes(expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_flashes_created_at ON public.flashes(created_at DESC);

COMMENT ON TABLE public.flashes IS 'Histórias efêmeras (Flash). Expiram em 24h após publicação.';

-- Habilitar RLS
ALTER TABLE public.flashes ENABLE ROW LEVEL SECURITY;

-- Leitura: próprio autor OU amigos aceitos
CREATE POLICY "flashes_select" ON public.flashes FOR SELECT
    TO authenticated
    USING (
        -- Não expirado
        expires_at > NOW()
        AND (
            -- Próprio autor
            author_id = auth.uid()
            OR
            -- É amigo aceito (qualquer direção)
            EXISTS (
                SELECT 1 FROM public.friendships f
                WHERE f.status = 'accepted'
                  AND (
                    (f.requester_id = auth.uid() AND f.addressee_id = author_id)
                    OR
                    (f.addressee_id = auth.uid() AND f.requester_id = author_id)
                  )
            )
        )
    );

-- Insert: apenas próprio usuário
CREATE POLICY "flashes_insert" ON public.flashes FOR INSERT
    TO authenticated
    WITH CHECK (author_id = auth.uid());

-- Delete: apenas próprio autor
CREATE POLICY "flashes_delete_row" ON public.flashes FOR DELETE
    TO authenticated
    USING (author_id = auth.uid());


-- ╔══════════════════════════════════════════════╗
-- ║  TABELA: flash_views                        ║
-- ║  Registro de quem viu cada flash            ║
-- ╚══════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.flash_views (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flash_id    UUID NOT NULL REFERENCES public.flashes(id) ON DELETE CASCADE,
    viewer_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Um usuário vê um flash apenas uma vez (para contagem)
    UNIQUE (flash_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_flash_views_flash   ON public.flash_views(flash_id);
CREATE INDEX IF NOT EXISTS idx_flash_views_viewer  ON public.flash_views(viewer_id);

COMMENT ON TABLE public.flash_views IS 'Registro de visualizações de Flashes. Unique por (flash, viewer).';

-- Habilitar RLS
ALTER TABLE public.flash_views ENABLE ROW LEVEL SECURITY;

-- Select: autor do flash pode ver quem assistiu; qualquer um pode ver sua própria view
CREATE POLICY "flash_views_select" ON public.flash_views FOR SELECT
    TO authenticated
    USING (
        viewer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.flashes f
            WHERE f.id = flash_id AND f.author_id = auth.uid()
        )
    );

-- Insert: qualquer autenticado pode registrar a própria view
CREATE POLICY "flash_views_insert" ON public.flash_views FOR INSERT
    TO authenticated
    WITH CHECK (viewer_id = auth.uid());


-- ╔══════════════════════════════════════════════╗
-- ║  FUNÇÃO + TRIGGER: limpeza automática       ║
-- ║  Remove flashes expirados (chamado via cron ║
-- ║  ou Edge Function; a view RLS já filtra)    ║
-- ╚══════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION public.delete_expired_flashes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.flashes WHERE expires_at < NOW();
END;
$$;

COMMENT ON FUNCTION public.delete_expired_flashes IS 'Remove flashes expirados. Chamar via pg_cron ou Edge Function diariamente.';
