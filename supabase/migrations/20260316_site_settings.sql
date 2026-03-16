-- ╔══════════════════════════════════════════════╗
-- ║  MIGRAÇÃO: site_settings                    ║
-- ║  Tabela de configurações do site (chave→valor) ║
-- ║  Execução: Supabase Dashboard → SQL Editor  ║
-- ╚══════════════════════════════════════════════╝

-- 1. Tabela key-value simples para configurações do site
CREATE TABLE IF NOT EXISTS public.site_settings (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_by  UUID REFERENCES public.profiles(id)
);

COMMENT ON TABLE public.site_settings IS 'Configurações do site em formato chave→valor. Apenas admins editam.';

-- 2. RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode LER (o front precisa do link do Discord)
CREATE POLICY "site_settings_select_authenticated"
    ON public.site_settings FOR SELECT
    TO authenticated
    USING (true);

-- Apenas admin pode INSERT
CREATE POLICY "site_settings_insert_admin"
    ON public.site_settings FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Apenas admin pode UPDATE
CREATE POLICY "site_settings_update_admin"
    ON public.site_settings FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- 3. Seed: insere o link atual do Discord
INSERT INTO public.site_settings (key, value)
VALUES ('discord_invite_url', 'https://discord.gg/vGzF4vyXkf')
ON CONFLICT (key) DO NOTHING;
