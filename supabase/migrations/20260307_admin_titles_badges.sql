-- 1. Admin Titles table
CREATE TABLE IF NOT EXISTS admin_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE admin_titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "titles_select_auth" ON admin_titles FOR SELECT TO authenticated USING (true);
CREATE POLICY "titles_all_admin" ON admin_titles FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- 2. Admin Badges table
CREATE TABLE IF NOT EXISTS admin_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE admin_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_select_auth" ON admin_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "badges_all_admin" ON admin_badges FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- 3. Update user_badges to support custom badges
-- Need to drop the existing NOT NULL constraint on challenge_id
ALTER TABLE user_badges ALTER COLUMN challenge_id DROP NOT NULL;

-- Remove old unique constraint to prevent conflicts when challenge_id is null
ALTER TABLE user_badges DROP CONSTRAINT IF EXISTS user_badges_user_id_challenge_id_key;

-- Add tracking for standalone admin badge
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS admin_badge_id UUID REFERENCES admin_badges(id) ON DELETE CASCADE;

-- Add distinct unique constraints so a user can't claim the same challenge OR the same admin_badge multiple times
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_badges_challenge_unq ON user_badges(user_id, challenge_id) WHERE challenge_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_badges_admin_unq ON user_badges(user_id, admin_badge_id) WHERE admin_badge_id IS NOT NULL;
