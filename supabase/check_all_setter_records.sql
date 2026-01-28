-- Find ALL setter script records for all users/funnels
SELECT 
  id,
  funnel_id,
  user_id,
  created_at,
  updated_at,
  jsonb_object_keys(content->'setterCallScript'->'quickOutline'->'callFlow') as field_keys
FROM vault_content
WHERE section_id = 'setterScript'
ORDER BY created_at DESC;
