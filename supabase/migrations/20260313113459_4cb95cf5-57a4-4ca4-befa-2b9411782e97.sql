UPDATE storage.buckets
SET file_size_limit = 15728640,
    allowed_mime_types = ARRAY[
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'video/mp4', 'video/webm'
    ]
WHERE id = 'product-images';