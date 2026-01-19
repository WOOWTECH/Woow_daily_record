-- supabase/migrations/010_permission_matrix.sql
-- PERMISSION MATRIX SCHEMA UPDATE
-- Updates page_permissions for module-based permissions

-- 1. Drop old constraints
ALTER TABLE public.page_permissions
DROP CONSTRAINT IF EXISTS page_permissions_page_check;

ALTER TABLE public.page_permissions
DROP CONSTRAINT IF EXISTS page_permissions_access_level_check;

-- 2. Add new constraints
ALTER TABLE public.page_permissions
ADD CONSTRAINT page_permissions_page_check
CHECK (page IN ('health', 'productivity', 'devices', 'finance'));

ALTER TABLE public.page_permissions
ADD CONSTRAINT page_permissions_access_level_check
CHECK (access_level IN ('close', 'view', 'control', 'full'));

-- 3. Clean old data
DELETE FROM public.page_permissions
WHERE page NOT IN ('health', 'productivity', 'devices', 'finance');

-- 4. Create default permissions for existing non-owner members
INSERT INTO public.page_permissions (household_member_id, page, access_level)
SELECT hm.id, module.name, 'close'
FROM public.household_members hm
CROSS JOIN (VALUES ('health'), ('productivity'), ('devices'), ('finance')) AS module(name)
WHERE hm.role != 'owner'
AND NOT EXISTS (
  SELECT 1 FROM public.page_permissions pp
  WHERE pp.household_member_id = hm.id AND pp.page = module.name
)
ON CONFLICT (household_member_id, page) DO NOTHING;
