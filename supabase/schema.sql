-- =============================================
-- SIMSKUT — Schema Completo para Supabase
-- Execute este SQL no SQL Editor do Supabase
-- https://supabase.com/dashboard → SQL Editor
-- =============================================

-- ╔══════════════════════════════════════════════╗
-- ║  1. TABELA: profiles                        ║
-- ║  Perfil público do usuário (1:1 com auth)   ║
-- ╚══════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username        TEXT UNIQUE NOT NULL,
    display_name    TEXT,
    avatar_url      TEXT,
    bio             TEXT,
    invite_code_used TEXT,
    is_admin        BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca por username
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

COMMENT ON TABLE public.profiles IS 'Perfil público de cada usuário do SimsKut';


-- ╔══════════════════════════════════════════════╗
-- ║  2. TABELA: invite_codes                    ║
-- ║  Códigos de convite (pendente → aprovado)   ║
-- ╚══════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.invite_codes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                TEXT UNIQUE NOT NULL,
    visitor_fingerprint TEXT,
    status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'used', 'rejected')),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    approved_at         TIMESTAMPTZ,
    approved_by         UUID REFERENCES public.profiles(id),
    used_by             UUID REFERENCES public.profiles(id),
    used_at             TIMESTAMPTZ
);

-- Índice para filtro por status (admin usa muito)
CREATE INDEX IF NOT EXISTS idx_invite_codes_status ON public.invite_codes(status);
CREATE INDEX IF NOT EXISTS idx_invite_codes_used_by ON public.invite_codes(used_by);

COMMENT ON TABLE public.invite_codes IS 'Códigos de convite. Status: pending → approved → used (ou rejected)';


-- ╔══════════════════════════════════════════════╗
-- ║  3. TABELA: friendships                     ║
-- ║  Sistema de amizades entre usuários         ║
-- ╚══════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.friendships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    addressee_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    -- Evita duplicatas (A→B e B→A)
    UNIQUE (requester_id, addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON public.friendships(addressee_id);

COMMENT ON TABLE public.friendships IS 'Relações de amizade entre usuários';


-- ╔══════════════════════════════════════════════╗
-- ║  4. TABELA: feed_posts                      ║
-- ║  Posts do feed social                       ║
-- ╚══════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.feed_posts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content     TEXT,
    image_url   TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),

    -- Pelo menos content ou image_url deve existir
    CHECK (content IS NOT NULL OR image_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_feed_posts_author ON public.feed_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON public.feed_posts(created_at DESC);

COMMENT ON TABLE public.feed_posts IS 'Posts do feed social. Precisa de conteúdo ou imagem';


-- ╔══════════════════════════════════════════════╗
-- ║  5. TABELA: photos                          ║
-- ║  Galeria de fotos (pública e privada)       ║
-- ╚══════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.photos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    title       TEXT,
    description TEXT,
    visibility  TEXT NOT NULL DEFAULT 'private'
                CHECK (visibility IN ('private', 'public')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_owner ON public.photos(owner_id);
CREATE INDEX IF NOT EXISTS idx_photos_visibility ON public.photos(visibility);

COMMENT ON TABLE public.photos IS 'Galeria de fotos dos usuários. Pode ser pública ou privada';


-- ╔══════════════════════════════════════════════╗
-- ║  5b. TABELA: photo_likes                     ║
-- ║  Likes nas fotos                             ║
-- ╚══════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.photo_likes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_id    UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),

    -- Um usuário curte uma foto apenas uma vez
    UNIQUE (photo_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_photo_likes_photo ON public.photo_likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_likes_user ON public.photo_likes(user_id);

COMMENT ON TABLE public.photo_likes IS 'Likes de fotos da galeria';


-- ╔══════════════════════════════════════════════╗
-- ║  5c. TABELA: photo_comments                  ║
-- ║  Comentários em fotos                        ║
-- ╚══════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.photo_comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_id    UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
    author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photo_comments_photo ON public.photo_comments(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_comments_author ON public.photo_comments(author_id);

COMMENT ON TABLE public.photo_comments IS 'Comentários nas fotos da galeria';


-- ╔══════════════════════════════════════════════╗
-- ║  6. TABELA: families                        ║
-- ║  Famílias Sims dos usuários                 ║
-- ╚══════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.families (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    family_name     TEXT NOT NULL,
    family_photo_url TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_families_owner ON public.families(owner_id);

COMMENT ON TABLE public.families IS 'Famílias Sims. Cada usuário pode ter uma ou mais';


-- ╔══════════════════════════════════════════════╗
-- ║  7. TABELA: sims                            ║
-- ║  Personagens Sims dentro de cada família    ║
-- ╚══════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.sims (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id   UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    photo_url   TEXT,
    profession  TEXT,
    bio         TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sims_family ON public.sims(family_id);

COMMENT ON TABLE public.sims IS 'Personagens Sims individuais dentro de uma família';


-- ╔══════════════════════════════════════════════╗
-- ║  8. TABELA: sim_traits                      ║
-- ║  Qualidades e habilidades de cada Sim       ║
-- ╚══════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.sim_traits (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sim_id      UUID NOT NULL REFERENCES public.sims(id) ON DELETE CASCADE,
    trait_type  TEXT NOT NULL CHECK (trait_type IN ('quality', 'skill')),
    value       TEXT NOT NULL,
    level       INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 10)
);

CREATE INDEX IF NOT EXISTS idx_sim_traits_sim ON public.sim_traits(sim_id);

COMMENT ON TABLE public.sim_traits IS 'Qualidades e habilidades dos Sims. Level de 1 a 10';


-- ╔══════════════════════════════════════════════╗
-- ║  9. TABELA: sim_photos                      ║
-- ║  Fotos individuais de cada Sim              ║
-- ╚══════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.sim_photos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sim_id      UUID NOT NULL REFERENCES public.sims(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    caption     TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sim_photos_sim ON public.sim_photos(sim_id);

COMMENT ON TABLE public.sim_photos IS 'Fotos individuais de cada personagem Sim';


-- ╔══════════════════════════════════════════════╗
-- ║  TRIGGER: Auto-criar profile no signup      ║
-- ║  Quando auth.users insere → cria profile    ║
-- ╚══════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data ->> 'preferred_username',   -- Discord
            NEW.raw_user_meta_data ->> 'user_name',            -- Discord fallback
            NEW.raw_user_meta_data ->> 'name',                 -- Google
            NULLIF(SPLIT_PART(NEW.email, '@', 1), ''),         -- Email fallback
            'user_' || substr(NEW.id::text, 1, 8)              -- Final fallback para evitar quebra de UNIQUE/NOT NULL
        ),
        COALESCE(
            NEW.raw_user_meta_data ->> 'full_name',            -- Google
            NEW.raw_user_meta_data -> 'custom_claims' ->> 'global_name', -- Discord (CORRIGIDO: -> em vez de ->>)
            NEW.raw_user_meta_data ->> 'name',                 -- Fallback
            SPLIT_PART(NEW.email, '@', 1),
            'User'
        ),
        COALESCE(
            NEW.raw_user_meta_data ->> 'avatar_url',           -- Both providers
            NEW.raw_user_meta_data ->> 'picture'               -- Google
        )
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vincula o trigger ao signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- ╔══════════════════════════════════════════════╗
-- ║  TRIGGER: Auto-criar invite no signup       ║
-- ║  Quando profile é criado → gera convite     ║
-- ╚══════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
DECLARE
    invite_code TEXT;
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    segment1 TEXT := '';
    segment2 TEXT := '';
    i INTEGER;
BEGIN
    -- Gera código SIMS-XXXX-XXXX
    FOR i IN 1..4 LOOP
        segment1 := segment1 || SUBSTR(chars, FLOOR(RANDOM() * LENGTH(chars) + 1)::INT, 1);
        segment2 := segment2 || SUBSTR(chars, FLOOR(RANDOM() * LENGTH(chars) + 1)::INT, 1);
    END LOOP;
    invite_code := 'SIMS-' || segment1 || '-' || segment2;

    INSERT INTO public.invite_codes (code, used_by, status)
    VALUES (invite_code, NEW.id, 'pending')
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_profile();


-- ╔══════════════════════════════════════════════╗
-- ║  TRIGGER: updated_at automático             ║
-- ║  Atualiza updated_at em feed_posts          ║
-- ╚══════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_feed_posts_updated_at ON public.feed_posts;
CREATE TRIGGER set_feed_posts_updated_at
    BEFORE UPDATE ON public.feed_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();


-- ╔══════════════════════════════════════════════════╗
-- ║  ROW LEVEL SECURITY (RLS) — Todas as tabelas    ║
-- ╚══════════════════════════════════════════════════════╝

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_posts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sims        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sim_traits  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sim_photos  ENABLE ROW LEVEL SECURITY;

-- ─── PROFILES ───────────────────────────────────────

-- Qualquer autenticado pode ler profiles (rede social)
CREATE POLICY "profiles_select_authenticated"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Usuário edita apenas o próprio perfil
CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Inserção via trigger (SECURITY DEFINER), mas permitir insert para signup
CREATE POLICY "profiles_insert_own"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- ─── INVITE_CODES ───────────────────────────────────

-- Usuário vê apenas os próprios convites
CREATE POLICY "invites_select_own"
    ON public.invite_codes FOR SELECT
    TO authenticated
    USING (
        used_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Qualquer autenticado pode criar convite (para si)
CREATE POLICY "invites_insert_own"
    ON public.invite_codes FOR INSERT
    TO authenticated
    WITH CHECK (used_by = auth.uid());

-- Apenas admin pode aprovar/rejeitar
CREATE POLICY "invites_update_admin"
    ON public.invite_codes FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- ─── FRIENDSHIPS ────────────────────────────────────

CREATE POLICY "friendships_select_own"
    ON public.friendships FOR SELECT
    TO authenticated
    USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY "friendships_insert_own"
    ON public.friendships FOR INSERT
    TO authenticated
    WITH CHECK (requester_id = auth.uid());

CREATE POLICY "friendships_update_involved"
    ON public.friendships FOR UPDATE
    TO authenticated
    USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY "friendships_delete_own"
    ON public.friendships FOR DELETE
    TO authenticated
    USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- ─── FEED_POSTS ─────────────────────────────────────

-- Qualquer autenticado pode ler posts (rede social)
CREATE POLICY "feed_posts_select_authenticated"
    ON public.feed_posts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "feed_posts_insert_own"
    ON public.feed_posts FOR INSERT
    TO authenticated
    WITH CHECK (author_id = auth.uid());

CREATE POLICY "feed_posts_update_own"
    ON public.feed_posts FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid());

CREATE POLICY "feed_posts_delete_own_or_admin"
    ON public.feed_posts FOR DELETE
    TO authenticated
    USING (
        author_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- ─── PHOTOS ─────────────────────────────────────────

-- Fotos públicas = todos; privadas = apenas dono
CREATE POLICY "photos_select_visibility"
    ON public.photos FOR SELECT
    TO authenticated
    USING (
        visibility = 'public'
        OR owner_id = auth.uid()
    );

CREATE POLICY "photos_insert_own"
    ON public.photos FOR INSERT
    TO authenticated
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "photos_update_own"
    ON public.photos FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid());

CREATE POLICY "photos_delete_own"
    ON public.photos FOR DELETE
    TO authenticated
    USING (owner_id = auth.uid());


-- ─── PHOTO_LIKES ────────────────────────────────────

CREATE POLICY "photo_likes_select"
    ON public.photo_likes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "photo_likes_insert_own"
    ON public.photo_likes FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "photo_likes_delete_own"
    ON public.photo_likes FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());


-- ─── PHOTO_COMMENTS ─────────────────────────────────

CREATE POLICY "photo_comments_select"
    ON public.photo_comments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "photo_comments_insert_own"
    ON public.photo_comments FOR INSERT
    TO authenticated
    WITH CHECK (author_id = auth.uid());

CREATE POLICY "photo_comments_delete_own_or_admin"
    ON public.photo_comments FOR DELETE
    TO authenticated
    USING (
        author_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- ─── FAMILIES ───────────────────────────────────────

CREATE POLICY "families_select_authenticated"
    ON public.families FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "families_insert_own"
    ON public.families FOR INSERT
    TO authenticated
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "families_update_own"
    ON public.families FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid());

CREATE POLICY "families_delete_own"
    ON public.families FOR DELETE
    TO authenticated
    USING (owner_id = auth.uid());

-- ─── SIMS ───────────────────────────────────────────

-- Qualquer autenticado pode ver sims (rede social)
CREATE POLICY "sims_select_authenticated"
    ON public.sims FOR SELECT
    TO authenticated
    USING (true);

-- Apenas dono da família pode inserir/editar/deletar sims
CREATE POLICY "sims_insert_own"
    ON public.sims FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.families
            WHERE id = family_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "sims_update_own"
    ON public.sims FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.families
            WHERE id = family_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "sims_delete_own"
    ON public.sims FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.families
            WHERE id = family_id AND owner_id = auth.uid()
        )
    );

-- ─── SIM_TRAITS ─────────────────────────────────────

CREATE POLICY "sim_traits_select_authenticated"
    ON public.sim_traits FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "sim_traits_insert_own"
    ON public.sim_traits FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sims s
            JOIN public.families f ON f.id = s.family_id
            WHERE s.id = sim_id AND f.owner_id = auth.uid()
        )
    );

CREATE POLICY "sim_traits_update_own"
    ON public.sim_traits FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.sims s
            JOIN public.families f ON f.id = s.family_id
            WHERE s.id = sim_id AND f.owner_id = auth.uid()
        )
    );

CREATE POLICY "sim_traits_delete_own"
    ON public.sim_traits FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.sims s
            JOIN public.families f ON f.id = s.family_id
            WHERE s.id = sim_id AND f.owner_id = auth.uid()
        )
    );

-- ─── SIM_PHOTOS ─────────────────────────────────────

CREATE POLICY "sim_photos_select_authenticated"
    ON public.sim_photos FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "sim_photos_insert_own"
    ON public.sim_photos FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sims s
            JOIN public.families f ON f.id = s.family_id
            WHERE s.id = sim_id AND f.owner_id = auth.uid()
        )
    );

CREATE POLICY "sim_photos_update_own"
    ON public.sim_photos FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.sims s
            JOIN public.families f ON f.id = s.family_id
            WHERE s.id = sim_id AND f.owner_id = auth.uid()
        )
    );

CREATE POLICY "sim_photos_delete_own"
    ON public.sim_photos FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.sims s
            JOIN public.families f ON f.id = s.family_id
            WHERE s.id = sim_id AND f.owner_id = auth.uid()
        )
    );


-- ╔══════════════════════════════════════════════════╗
-- ║  STORAGE BUCKET — Fotos e imagens               ║
-- ╚══════════════════════════════════════════════════════╝

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage: qualquer autenticado pode fazer upload na própria pasta
CREATE POLICY "avatars_upload" ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_read" ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'avatars');

CREATE POLICY "photos_upload" ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "photos_read" ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'photos');

CREATE POLICY "posts_upload" ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "posts_read" ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'posts');


-- ╔══════════════════════════════════════════════════╗
-- ║  PROFILE UPDATES — Colunas novas + RPC          ║
-- ╚══════════════════════════════════════════════════════╝

-- Novas colunas do perfil (banner e website)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Storage policy de UPDATE para avatars (banner reutiliza mesmo bucket)
CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RPC para contadores do perfil (evita N+1 queries)
CREATE OR REPLACE FUNCTION get_profile_stats(target_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'friends_count', (SELECT COUNT(*)::INT FROM friendships
      WHERE (requester_id = target_id OR addressee_id = target_id) AND status = 'accepted'),
    'posts_count', (SELECT COUNT(*)::INT FROM feed_posts WHERE author_id = target_id),
    'photos_count', (SELECT COUNT(*)::INT FROM photos WHERE owner_id = target_id)
  );
$$ LANGUAGE sql SECURITY DEFINER;


-- ╔══════════════════════════════════════════════════╗
-- ║  SEED: Primeiro admin (ALTERE O EMAIL!)         ║
-- ╚══════════════════════════════════════════════════════╝

-- Descomente e altere o email para definir quem é admin:
-- UPDATE public.profiles SET is_admin = true
-- WHERE username = 'SEU_USERNAME_AQUI';

-- =============================================
-- FIM DO SCHEMA ORIGINAL — SimsKut
-- Execute este SQL inteiro no Supabase SQL Editor
-- =============================================


-- ╔══════════════════════════════════════════════╗
-- ║  10. TABELA: notifications                  ║
-- ║  Notificações de menções (@) em posts/cmts  ║
-- ╚══════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type        TEXT NOT NULL CHECK (type IN ('mention_post', 'mention_comment', 'like_post', 'like_photo', 'comment_photo')),
    reference_id UUID,
    content     TEXT,
    read        BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

COMMENT ON TABLE public.notifications IS 'Notificações de menções. type: mention_post ou mention_comment';

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Usuário vê apenas as próprias notificações
CREATE POLICY "notifications_select_own"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Qualquer autenticado pode criar notificação (ao mencionar alguém)
CREATE POLICY "notifications_insert_authenticated"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (actor_id = auth.uid());

-- Usuário pode atualizar as próprias (marcar como lida)
CREATE POLICY "notifications_update_own"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Usuário pode deletar as próprias
CREATE POLICY "notifications_delete_own"
    ON public.notifications FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

