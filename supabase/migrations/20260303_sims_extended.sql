-- 1. TABELA: families (base para criar Sims)
CREATE TABLE IF NOT EXISTS public.families (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    family_name     TEXT NOT NULL,
    family_photo_url TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS e criar políticas para families
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "families_select_authenticated" ON public.families;
CREATE POLICY "families_select_authenticated" ON public.families FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "families_insert_own" ON public.families;
CREATE POLICY "families_insert_own" ON public.families FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "families_update_own" ON public.families;
CREATE POLICY "families_update_own" ON public.families FOR UPDATE TO authenticated USING (owner_id = auth.uid());
DROP POLICY IF EXISTS "families_delete_own" ON public.families;
CREATE POLICY "families_delete_own" ON public.families FOR DELETE TO authenticated USING (owner_id = auth.uid());


-- 2. TABELA: sims (aqui entram seus Sims + as novas colunas)
CREATE TABLE IF NOT EXISTS public.sims (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id   UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    photo_url   TEXT,
    profession  TEXT,
    bio         TEXT,
    life_stage  TEXT,    -- Nova coluna
    occult_type TEXT,    -- Nova coluna
    aspiration  TEXT,    -- Nova coluna
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS e criar políticas para sims
ALTER TABLE public.sims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sims_select_authenticated" ON public.sims;
CREATE POLICY "sims_select_authenticated" ON public.sims FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "sims_insert_own" ON public.sims;
CREATE POLICY "sims_insert_own" ON public.sims FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.families WHERE id = family_id AND owner_id = auth.uid()));
DROP POLICY IF EXISTS "sims_update_own" ON public.sims;
CREATE POLICY "sims_update_own" ON public.sims FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.families WHERE id = family_id AND owner_id = auth.uid()));
DROP POLICY IF EXISTS "sims_delete_own" ON public.sims;
CREATE POLICY "sims_delete_own" ON public.sims FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.families WHERE id = family_id AND owner_id = auth.uid()));


-- 3. TABELA: sim_traits (traços dos Sims)
CREATE TABLE IF NOT EXISTS public.sim_traits (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sim_id      UUID NOT NULL REFERENCES public.sims(id) ON DELETE CASCADE,
    trait_type  TEXT NOT NULL CHECK (trait_type IN ('quality', 'skill')),
    value       TEXT NOT NULL,
    level       INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 10)
);

-- Habilitar RLS para sim_traits
ALTER TABLE public.sim_traits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sim_traits_select_authenticated" ON public.sim_traits;
CREATE POLICY "sim_traits_select_authenticated" ON public.sim_traits FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "sim_traits_insert_own" ON public.sim_traits;
CREATE POLICY "sim_traits_insert_own" ON public.sim_traits FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.sims s JOIN public.families f ON f.id = s.family_id WHERE s.id = sim_id AND f.owner_id = auth.uid()));
DROP POLICY IF EXISTS "sim_traits_update_own" ON public.sim_traits;
CREATE POLICY "sim_traits_update_own" ON public.sim_traits FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.sims s JOIN public.families f ON f.id = s.family_id WHERE s.id = sim_id AND f.owner_id = auth.uid()));
DROP POLICY IF EXISTS "sim_traits_delete_own" ON public.sim_traits;
CREATE POLICY "sim_traits_delete_own" ON public.sim_traits FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.sims s JOIN public.families f ON f.id = s.family_id WHERE s.id = sim_id AND f.owner_id = auth.uid()));


-- E por via das dúvidas: se as tabelas já existiam, mas faltavam apenas as colunas:
ALTER TABLE public.sims 
ADD COLUMN IF NOT EXISTS life_stage TEXT,
ADD COLUMN IF NOT EXISTS occult_type TEXT,
ADD COLUMN IF NOT EXISTS aspiration TEXT;



-- Migration for adding life_stage, occult_type, aspiration to sims
ALTER TABLE public.sims 
ADD COLUMN IF NOT EXISTS life_stage TEXT,
ADD COLUMN IF NOT EXISTS occult_type TEXT,
ADD COLUMN IF NOT EXISTS aspiration TEXT;

