-- Fixes para o Bucket de Assets dos Desafios
-- 1. Garante que o bucket está configurado de forma correta e pública
INSERT INTO storage.buckets (id, name, public)
VALUES ('challenge-assets', 'challenge-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Limpa as políticas existentes para não haver duplicação/conflito
DROP POLICY IF EXISTS "challenge_assets_admin_upload" ON storage.objects;
DROP POLICY IF EXISTS "challenge_assets_public_read" ON storage.objects;
DROP POLICY IF EXISTS "challenge_assets_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "challenge_assets_admin_delete" ON storage.objects;

-- 3. Recria a leitura pública explícita (MUITO IMPORTANTE para capas)
CREATE POLICY "challenge_assets_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'challenge-assets');

-- 4. Permite que administradores insiram, atualizem e deletem arquivos
CREATE POLICY "challenge_assets_admin_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'challenge-assets' AND
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY "challenge_assets_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'challenge-assets' AND
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY "challenge_assets_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'challenge-assets' AND
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );
