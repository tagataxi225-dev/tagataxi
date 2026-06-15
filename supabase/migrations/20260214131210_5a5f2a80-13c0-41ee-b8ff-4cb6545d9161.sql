CREATE TABLE public.user_suggestions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('client','driver','partner','restaurant')),
  category text NOT NULL CHECK (category IN ('feature','bug','ui','other')),
  message text NOT NULL CHECK (char_length(message) <= 500),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own suggestions"
  ON public.user_suggestions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own suggestions"
  ON public.user_suggestions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all suggestions"
  ON public.user_suggestions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true));