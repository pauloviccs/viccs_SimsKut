-- ╔══════════════════════════════════════════════════╗
-- ║  RPC: admin_set_verified                        ║
-- ║  Permite admin marcar/desmarcar is_verified     ║
-- ║  SECURITY DEFINER → bypassa RLS com segurança   ║
-- ╚══════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION public.admin_set_verified(
    target_user_id UUID,
    verified BOOLEAN
)
RETURNS VOID AS $$
BEGIN
    -- Verifica se quem tá chamando é admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Apenas administradores podem alterar a verificação.';
    END IF;

    -- Atualiza o is_verified do usuário alvo
    UPDATE public.profiles
    SET is_verified = verified
    WHERE id = target_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuário não encontrado.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
