-- Get the actual JSON structure of the most recent setterScript
SELECT 
  id,
  funnel_id,
  created_at,
  content->'setterCallScript' as setter_content,
  jsonb_pretty(content) as full_json
FROM vault_content
WHERE section_id = 'setterScript'
ORDER BY created_at DESC
LIMIT 1;
