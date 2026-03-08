-- Tabela para rastrear quais títulos cada usuário possui (atribuídos pelo admin)
-- title_id é opcional: preenchido para títulos de admin_titles, NULL para títulos de desafios
CREATE TABLE IF NOT EXISTS user_titles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title_id    UUID REFERENCES admin_titles(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now()
);

-- Idempotência: remove constraints antigas se existirem
ALTER TABLE user_titles DROP CONSTRAINT IF EXISTS user_titles_user_id_title_id_key;

-- Remove UNIQUE CONSTRAINT (derruba o índice backing automaticamente)
-- NOTA: DROP INDEX falha quando o índice pertence a uma constraint; usar DROP CONSTRAINT.
ALTER TABLE user_titles DROP CONSTRAINT IF EXISTS user_titles_user_id_title_unq;

-- Adiciona UNIQUE CONSTRAINT por texto (DO block = idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_titles_user_id_title_unq'
      AND conrelid = 'user_titles'::regclass
  ) THEN
    ALTER TABLE user_titles ADD CONSTRAINT user_titles_user_id_title_unq UNIQUE (user_id, title);
  END IF;
END;
$$;

-- Corrige FK do title_id para ON DELETE SET NULL
ALTER TABLE user_titles DROP CONSTRAINT IF EXISTS user_titles_title_id_fkey;
ALTER TABLE user_titles
  ADD CONSTRAINT user_titles_title_id_fkey
  FOREIGN KEY (title_id) REFERENCES admin_titles(id) ON DELETE SET NULL;

ALTER TABLE user_titles ENABLE ROW LEVEL SECURITY;

-- Usuário autenticado pode ver seus próprios títulos
DROP POLICY IF EXISTS "user_titles_select_own" ON user_titles;
CREATE POLICY "user_titles_select_own"
  ON user_titles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admin pode fazer tudo (USING + WITH CHECK para cobrir INSERT/UPDATE também)
DROP POLICY IF EXISTS "user_titles_admin_all" ON user_titles;
CREATE POLICY "user_titles_admin_all"
  ON user_titles FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Força o PostgREST a recarregar o schema para reconhecer a tabela nova e policies
NOTIFY pgrst, 'reload schema';
