-- Add detailed info column to children table
ALTER TABLE children ADD COLUMN IF NOT EXISTS details text;

-- Create storage bucket for baby photos if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('baby_photos', 'baby_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload to baby_photos
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'baby_photos' );

CREATE POLICY "Allow authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'baby_photos' );

CREATE POLICY "Allow authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'baby_photos' );

CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'baby_photos' );
