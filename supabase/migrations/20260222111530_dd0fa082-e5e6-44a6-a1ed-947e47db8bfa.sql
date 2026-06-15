SELECT cron.schedule(
  'expire-partner-promotions',
  '0 * * * *',
  $$SELECT expire_partner_promotions()$$
);