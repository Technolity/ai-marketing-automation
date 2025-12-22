-- Create storage bucket for funnel images
INSERT INTO storage.buckets (id, name, public)
VALUES ('funnel-images', 'funnel-images', true) ON CONFLICT (id) DO NOTHING;
-- Policy: Allow authenticated users (Clerk/Supabase) to upload images
-- logic: anyone with a valid authenticated role can upload to their own folder (enforced by app logic, but RLS here helps)
CREATE POLICY "Authenticated users can upload funnel images" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (bucket_id = 'funnel-images');
-- Policy: Allow public to view images (needed for funnel page and DALL-E download)
CREATE POLICY "Public can view funnel images" ON storage.objects FOR
SELECT TO public USING (bucket_id = 'funnel-images');
-- Policy: Allow users to update/delete their own images (optional but good hygiene)
CREATE POLICY "Users can update own funnel images" ON storage.objects FOR
UPDATE TO authenticated USING (
        bucket_id = 'funnel-images'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
CREATE POLICY "Users can delete own funnel images" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'funnel-images'
    AND (storage.foldername(name)) [1] = auth.uid()::text
);