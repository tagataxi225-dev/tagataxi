-- Allow sellers to delete their own products
CREATE POLICY "Sellers can delete their own products"
ON public.marketplace_products
FOR DELETE
USING (auth.uid() = seller_id);

-- Allow admins to delete any product
CREATE POLICY "Admins can delete any product"
ON public.marketplace_products
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);