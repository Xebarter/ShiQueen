-- Accept AVIF as an input format for product and partner image uploads.
-- Stored objects remain WebP/JPEG after server-side optimization.

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
where id in ('products', 'providers', 'suppliers', 'ads');
