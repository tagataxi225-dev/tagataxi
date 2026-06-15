-- Allow public read on partenaires (public info: name, logo, banner)
CREATE POLICY "partenaires_public_read_basic"
ON public.partenaires
FOR SELECT
TO authenticated, anon
USING (true);

-- Allow public read on partner_rental_followers (count is public)
CREATE POLICY "partner_rental_followers_public_read"
ON public.partner_rental_followers
FOR SELECT
TO authenticated, anon
USING (true);

-- Allow public read on partner_rental_subscriptions (tier info for sorting)
CREATE POLICY "partner_rental_subscriptions_public_read"
ON public.partner_rental_subscriptions
FOR SELECT
TO authenticated, anon
USING (true);

-- Allow public read on rental_subscription_plans (tier names)
CREATE POLICY "rental_subscription_plans_public_read"
ON public.rental_subscription_plans
FOR SELECT
TO authenticated, anon
USING (true);