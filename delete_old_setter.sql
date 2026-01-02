-- Delete the old setter script record from 5 hours ago
DELETE FROM vault_content 
WHERE id = '2d47a3b5-133d-4ebe-a637-539aef7e2e72';

-- Verify it's deleted (should return 0)
SELECT COUNT(*) as remaining_records
FROM vault_content 
WHERE section_id = 'setterScript';
