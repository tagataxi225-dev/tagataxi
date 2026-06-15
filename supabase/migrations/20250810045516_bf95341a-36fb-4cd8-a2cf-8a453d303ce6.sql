-- Create promotional ads table for admin-managed advertisements
CREATE TABLE public.promotional_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  cta_text TEXT NOT NULL DEFAULT 'En savoir plus',
  cta_action TEXT NOT NULL, -- 'redirect', 'service', 'product'
  cta_target TEXT, -- URL, service type, or product ID
  target_zones JSONB DEFAULT '[]'::jsonb, -- Geographical targeting
  target_user_types TEXT[] DEFAULT ARRAY['all'], -- client, driver, partner, all
  display_priority INTEGER DEFAULT 1,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  click_count INTEGER DEFAULT 0,
  impression_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotional_ads ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view active ads" 
ON public.promotional_ads 
FOR SELECT 
USING (is_active = true AND (start_date <= now()) AND (end_date IS NULL OR end_date >= now()));

CREATE POLICY "Admins can manage promotional ads" 
ON public.promotional_ads 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_promotional_ads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_promotional_ads_updated_at
  BEFORE UPDATE ON public.promotional_ads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_promotional_ads_updated_at();

-- Insert some sample promotional ads
INSERT INTO public.promotional_ads (title, description, image_url, cta_text, cta_action, cta_target, display_priority) VALUES
('Go Green - Réservez Éco', 'Voyagez écologique avec nos véhicules hybrides et contribuez à la protection de l''environnement', 'https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=400&h=200&fit=crop', 'Réserver Éco', 'service', 'transport', 2),
('Go Cheaper - Réservez Shuttle', 'Économisez sur vos trajets avec nos services de transport partagé à prix réduit', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=200&fit=crop', 'Voir Offres', 'service', 'transport', 1),
('Marketplace Kwenda', 'Découvrez des milliers de produits locaux à prix imbattables sur notre marketplace', 'https://images.unsplash.com/photo-1557821552-17105176677c?w=400&h=200&fit=crop', 'Explorer', 'service', 'marketplace', 3);