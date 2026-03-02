-- =========================================
-- Migração Complementar: Storage de Notícias
-- Execute caso já tenha criado a tabela news anterior
-- =========================================

-- 1. Adicionar o campo image_url
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Criar bucket 'news'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('news', 'news', true) ON CONFLICT (id) DO NOTHING;

-- 3. Políticas para upload e view
CREATE POLICY "news_upload" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'news' AND (
      EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.is_admin = true
      )
  ));
  
CREATE POLICY "news_read" ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'news');
