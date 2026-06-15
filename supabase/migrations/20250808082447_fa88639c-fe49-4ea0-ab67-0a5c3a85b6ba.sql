
-- 1) Étendre les statuts autorisés pour éviter l'erreur lors de l'acceptation et de l'arrivée
ALTER TABLE public.transport_bookings
  DROP CONSTRAINT IF EXISTS transport_bookings_status_check;

ALTER TABLE public.transport_bookings
  ADD CONSTRAINT transport_bookings_status_check
  CHECK (
    status = ANY (
      ARRAY[
        'pending'::text,
        'accepted'::text,
        'driver_arrived'::text,
        'in_progress'::text,
        'completed'::text,
        'cancelled'::text
      ]
    )
  );

-- 2) Définir une valeur par défaut plus sûre
ALTER TABLE public.transport_bookings
  ALTER COLUMN status SET DEFAULT 'pending';

-- 3) Index utiles pour les listes et le temps réel
CREATE INDEX IF NOT EXISTS idx_transport_bookings_status_created_at
  ON public.transport_bookings (status, created_at);

CREATE INDEX IF NOT EXISTS idx_transport_bookings_driver_id
  ON public.transport_bookings (driver_id);
