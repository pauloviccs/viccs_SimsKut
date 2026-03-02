-- =============================================
-- Notifications Extended
-- Adiciona novos tipos de notificação:
-- - comment_post     (comentário em post)
-- - like_comment     (curtida em comentário)
-- - reaction_post    (reação com emoji em post)
-- - new_post_friend  (novo post de amigo / seguido)
-- =============================================

-- Ajusta a constraint de CHECK em notifications.type
ALTER TABLE public.notifications
    DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
        'mention_post',
        'mention_comment',
        'like_post',
        'like_photo',
        'comment_photo',
        'comment_post',
        'like_comment',
        'reaction_post',
        'new_post_friend'
    ));

