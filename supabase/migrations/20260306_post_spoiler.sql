-- Adiciona a coluna is_spoiler para posts com spoiler
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS is_spoiler BOOLEAN DEFAULT false;
