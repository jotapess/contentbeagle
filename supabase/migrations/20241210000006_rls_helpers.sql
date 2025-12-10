-- =============================================
-- Migration 06: RLS Helper Functions
-- Security helper functions for Row Level Security
-- =============================================

-- Check if user is member of a team
CREATE OR REPLACE FUNCTION is_team_member(p_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = p_team_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has specific role(s) in team
CREATE OR REPLACE FUNCTION has_team_role(p_team_id UUID, p_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = p_team_id
        AND user_id = auth.uid()
        AND role = ANY(p_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get all team IDs for current user (for efficient filtering)
CREATE OR REPLACE FUNCTION get_user_teams()
RETURNS SETOF UUID AS $$
    SELECT team_id FROM team_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get user's role in a specific team
CREATE OR REPLACE FUNCTION get_user_role(p_team_id UUID)
RETURNS TEXT AS $$
    SELECT role FROM team_members
    WHERE team_id = p_team_id AND user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user owns a team
CREATE OR REPLACE FUNCTION is_team_owner(p_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM teams
        WHERE id = p_team_id
        AND owner_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION is_team_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_team_role(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_teams() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_team_owner(UUID) TO authenticated;
