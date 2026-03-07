-- ========================================================
-- View: trending_hashtags
-- Extrai todas as hashtags de feed_posts (content) e photos (description), 
-- e as agrupa contabilizando as mais populares.
-- ========================================================

CREATE OR REPLACE VIEW public.trending_hashtags AS
WITH all_tags AS (
    -- Pega tags nos feed_posts
    SELECT lower((regexp_matches(content, '#([a-zA-Z0-9_]+)', 'g'))[1]) AS tag
    FROM public.feed_posts
    WHERE content IS NOT NULL
    
    UNION ALL
    
    -- Pega tags na descricao das rotas da Galeria Global
    SELECT lower((regexp_matches(description, '#([a-zA-Z0-9_]+)', 'g'))[1]) AS tag
    FROM public.photos
    WHERE description IS NOT NULL AND visibility = 'public'
)
SELECT 
    tag, 
    COUNT(*) AS count
FROM all_tags
GROUP BY tag
ORDER BY count DESC;

-- Garante que todos possam ler a View, uma vez que ela e publica (os feedposts e gallerias listadas ja sao visiveis logado)
GRANT SELECT ON public.trending_hashtags TO authenticated;
GRANT SELECT ON public.trending_hashtags TO anon;
