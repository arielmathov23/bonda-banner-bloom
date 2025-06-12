-- Add product_photos_urls column to partners table
ALTER TABLE partners ADD COLUMN product_photos_urls TEXT[] DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN partners.product_photos_urls IS 'Array of URLs for product photos used in banner generation'; 