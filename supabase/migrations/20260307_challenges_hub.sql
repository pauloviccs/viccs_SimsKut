-- =============================================
-- TABELA: challenges
-- Desafios publicados por admins
-- =============================================
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,                          -- Nome do desafio (ex: "Desafio 100 Bebês")
  slug TEXT UNIQUE NOT NULL,                    -- URL-friendly (ex: "desafio-100-bebes")
  description TEXT NOT NULL,                   -- Descrição completa do desafio
  rules TEXT,                                   -- Regras detalhadas (markdown aceito)
  thumbnail_url TEXT,                           -- Imagem de capa do card
  badge_image_url TEXT NOT NULL,               -- Imagem do emblema/badge de conclusão
  badge_title TEXT NOT NULL,                   -- Título conferido ao usuário (ex: "Mãe Lendária")
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'draft', 'archived')),
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,                          -- NULL = sem prazo
  max_participants INT,                         -- NULL = ilimitado
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABELA: challenge_milestones
-- Etapas/marcos de cada desafio
-- =============================================
CREATE TABLE challenge_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  order_index INT NOT NULL,                     -- Ordem sequencial (1, 2, 3...)
  title TEXT NOT NULL,                          -- Nome do milestone (ex: "Geração 1 — Nascimento")
  description TEXT,                             -- O que o usuário deve fazer/registrar
  is_final BOOLEAN DEFAULT false,              -- TRUE = milestone de conclusão do desafio
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABELA: challenge_participants
-- Inscrições dos usuários nos desafios
-- =============================================
CREATE TABLE challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  completed_at TIMESTAMPTZ,
  badge_claimed BOOLEAN DEFAULT false,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(challenge_id, user_id)                -- Um usuário só se inscreve uma vez por desafio
);

-- =============================================
-- TABELA: challenge_milestone_entries
-- Registro de conquistas de milestones pelo usuário
-- Máximo 2 mídias por entrada
-- =============================================
CREATE TABLE challenge_milestone_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES challenge_participants(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES challenge_milestones(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),  -- Desnormalizado para RLS simples
  note TEXT,                                    -- Nota opcional do usuário
  media_url_1 TEXT,                             -- Primeira mídia (obrigatória)
  media_url_2 TEXT,                             -- Segunda mídia (opcional)
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participant_id, milestone_id)          -- Cada milestone concluído uma única vez
);

-- =============================================
-- TABELA: user_badges
-- Emblemas conquistados pelos usuários
-- =============================================
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id),
  badge_image_url TEXT NOT NULL,
  badge_title TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  is_featured BOOLEAN DEFAULT false,            -- Usuário pode fixar até 3 no perfil
  UNIQUE(user_id, challenge_id)                 -- Um badge por desafio por usuário
);

-- =============================================
-- VIEWS UTILITÁRIAS
-- =============================================

-- Progresso de um participante (milestones concluídos / total)
CREATE OR REPLACE VIEW challenge_progress_view AS
SELECT
  cp.id AS participant_id,
  cp.user_id,
  cp.challenge_id,
  cp.status,
  COUNT(cme.id) AS milestones_completed,
  (
    SELECT COUNT(*) FROM challenge_milestones cm
    WHERE cm.challenge_id = cp.challenge_id
  ) AS milestones_total,
  ROUND(
    COUNT(cme.id)::NUMERIC /
    NULLIF((SELECT COUNT(*) FROM challenge_milestones cm WHERE cm.challenge_id = cp.challenge_id), 0) * 100
  ) AS progress_pct
FROM challenge_participants cp
LEFT JOIN challenge_milestone_entries cme ON cme.participant_id = cp.id
GROUP BY cp.id, cp.user_id, cp.challenge_id, cp.status;

-- Total de participantes por desafio
CREATE OR REPLACE VIEW challenge_stats_view AS
SELECT
  c.id AS challenge_id,
  c.title,
  COUNT(DISTINCT cp.user_id) AS total_participants,
  COUNT(DISTINCT CASE WHEN cp.status = 'completed' THEN cp.user_id END) AS total_completed
FROM challenges c
LEFT JOIN challenge_participants cp ON cp.challenge_id = c.id
GROUP BY c.id, c.title;

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================
CREATE INDEX idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX idx_milestone_entries_participant ON challenge_milestone_entries(participant_id);
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_challenges_status ON challenges(status);

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-atualiza updated_at em challenges
CREATE OR REPLACE FUNCTION update_challenge_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW EXECUTE FUNCTION update_challenge_updated_at();

-- Ao completar o milestone final → marca participante como 'completed'
-- e concede o badge automaticamente
CREATE OR REPLACE FUNCTION handle_final_milestone_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_challenge_id UUID;
  v_milestone_is_final BOOLEAN;
  v_badge_image TEXT;
  v_badge_title TEXT;
BEGIN
  -- Verifica se o milestone é o final
  SELECT cm.is_final, cm.challenge_id
  INTO v_milestone_is_final, v_challenge_id
  FROM challenge_milestones cm
  WHERE cm.id = NEW.milestone_id;

  IF v_milestone_is_final THEN
    -- Atualiza status do participante
    UPDATE challenge_participants
    SET status = 'completed', completed_at = now()
    WHERE id = NEW.participant_id;

    -- Busca dados do badge
    SELECT c.badge_image_url, c.badge_title
    INTO v_badge_image, v_badge_title
    FROM challenges c
    WHERE c.id = v_challenge_id;

    -- Concede o badge
    INSERT INTO user_badges (user_id, challenge_id, badge_image_url, badge_title)
    VALUES (NEW.user_id, v_challenge_id, v_badge_image, v_badge_title)
    ON CONFLICT (user_id, challenge_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_milestone_entry_insert
  AFTER INSERT ON challenge_milestone_entries
  FOR EACH ROW EXECUTE FUNCTION handle_final_milestone_completion();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_milestone_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- challenges: leitura pública para autenticados; escrita apenas admins
CREATE POLICY "challenges_select_authenticated"
  ON challenges FOR SELECT
  TO authenticated
  USING (status IN ('active', 'archived'));

CREATE POLICY "challenges_admin_all"
  ON challenges FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- challenge_milestones: leitura aberta a autenticados
CREATE POLICY "milestones_select_authenticated"
  ON challenge_milestones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "milestones_admin_all"
  ON challenge_milestones FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- challenge_participants: usuário gerencia os próprios registros
CREATE POLICY "participants_select_own"
  ON challenge_participants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "participants_insert_own"
  ON challenge_participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "participants_update_own"
  ON challenge_participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- challenge_milestone_entries: usuário gerencia as próprias entradas
CREATE POLICY "entries_select_own"
  ON challenge_milestone_entries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "entries_insert_own"
  ON challenge_milestone_entries FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- user_badges: leitura pública (visível no perfil); escrita via trigger
CREATE POLICY "badges_select_all_authenticated"
  ON user_badges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "badges_update_own"
  ON user_badges FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================
-- STORAGE BUCKETS POLICIES
-- =============================================
-- Nota: Para que esta parte execute sozinha em migração sem erros se o bucket já existir, 
-- fazemos um insert tratável (embora Supabase storage insert em raw SQL exija schema `storage`).

INSERT INTO storage.buckets (id, name, public)
VALUES ('challenge-media', 'challenge-media', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "challenge_media_upload_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'challenge-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "challenge_media_select_own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'challenge-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

INSERT INTO storage.buckets (id, name, public)
VALUES ('challenge-assets', 'challenge-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "challenge_assets_admin_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'challenge-assets'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Inserir o primeiro desafio de 'seed' como exemplo opcional
-- Desativado por padrão. Caso desejar, descomente no seu painel:

/*
INSERT INTO challenges (
  title, slug, description, rules, badge_title, badge_image_url, status, created_by
) VALUES (
  'Desafio 100 Bebês',
  'desafio-100-bebes',
  'O clássico desafio do The Sims! Crie 100 bebês com uma matriarca.',
  '## Regras\n1. Um único Sim matriarca\n2. Cada bebê deve ter um pai diferente\n3. Documente cada geração com pelo menos uma screenshot',
  'Mãe Lendária',
  'https://seu-bucket.supabase.co/storage/v1/object/public/challenge-assets/badges/100babies.webp',
  'active',
  (SELECT id FROM auth.users LIMIT 1)
);

INSERT INTO challenge_milestones (challenge_id, order_index, title, description, is_final)
VALUES
  ((SELECT id FROM challenges WHERE slug='desafio-100-bebes'), 1, 'Geração 1', 'Registre o nascimento do primeiro bebê', false),
  ((SELECT id FROM challenges WHERE slug='desafio-100-bebes'), 2, 'Metade da Jornada', 'Celebre os primeiros 50 bebês!', false),
  ((SELECT id FROM challenges WHERE slug='desafio-100-bebes'), 3, '100 Bebês!', 'Comprove a chegada do 100º bebê. Você é uma lenda!', true);
*/
