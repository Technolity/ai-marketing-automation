-- Check what setterScript records actually exist
SELECT 
  id,
  funnel_id,
  created_at,
  content->'setterCallScript' as setter_content,
  jsonb_object_keys(content->'setterCallScript'->'quickOutline'->'callFlow') as flow_keys
FROM vault_content
WHERE section_id = 'setterScript'
ORDER BY created_at DESC;
