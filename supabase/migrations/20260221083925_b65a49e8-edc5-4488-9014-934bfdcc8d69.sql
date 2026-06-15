-- Seed promo data on existing food products
UPDATE public.food_products SET discount_percentage = 30, original_price = 8000, price = 5600 WHERE id = '114a3f35-415f-47a2-af52-d3055da9f472';
UPDATE public.food_products SET discount_percentage = 20, original_price = 35000, price = 28000 WHERE id = '1e705fd0-d389-4cd0-bb34-12189b79f619';
UPDATE public.food_products SET discount_percentage = 30, original_price = 9000, price = 6300 WHERE id = '34b2f0ba-2131-411f-beff-b676095a2f02';
UPDATE public.food_products SET discount_percentage = 15, original_price = 15000, price = 12750 WHERE id = '3657428a-3bc0-4877-bd76-004bd11d7444';