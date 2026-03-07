-- Fixes para o sistema de Abandono (Unenroll)
-- O banco estava impedindo de deletar as participações sem uma Policy (RLS). 

-- 1. Garante que os participantes possam deletar sua própria entrada
CREATE POLICY "participants_delete_own"
  ON challenge_participants FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Garante que se ele sair, qualquer mídia que ele linkou em entries também caia
CREATE POLICY "entries_delete_own"
  ON challenge_milestone_entries FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
