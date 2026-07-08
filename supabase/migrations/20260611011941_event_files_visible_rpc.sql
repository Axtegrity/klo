-- Reconstructed 2026-07-08 for migration history reconciliation.
-- This migration was applied directly to prod with no corresponding local file.
-- Content below is the exact live definition of public.get_visible_event_files
-- pulled via pg_get_functiondef() on 2026-07-08. [verified against prod schema]
CREATE OR REPLACE FUNCTION public.get_visible_event_files(p_event_ids uuid[])
 RETURNS TABLE(id uuid, event_id uuid, file_name text, file_type text, file_url text, file_size text, is_visible boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
    SELECT ef.id, ef.event_id, ef.file_name, ef.file_type, ef.file_url, ef.file_size, ef.is_visible
    FROM event_files ef
    WHERE ef.event_id = ANY(p_event_ids)
    AND ef.is_visible = true;
END;
$function$
;
