-- Migration: Ajouter des offres d'emploi de test pour Kwenda Job
-- Description: Insère des entreprises et offres d'emploi de démonstration

-- Insérer des entreprises test
INSERT INTO job_companies (id, owner_user_id, name, description, logo_url, city, is_verified, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM auth.users LIMIT 1), 'Kwenda Partner', 'Leader du transport VTC en RDC', NULL, 'Kinshasa', true, NOW()),
  ('22222222-2222-2222-2222-222222222222', (SELECT id FROM auth.users LIMIT 1), 'Delivery Express', 'Service de livraison rapide', NULL, 'Lubumbashi', true, NOW()),
  ('33333333-3333-3333-3333-333333333333', (SELECT id FROM auth.users LIMIT 1), 'Tech Solutions RDC', 'Entreprise technologique innovante', NULL, 'Kinshasa', false, NOW()),
  ('44444444-4444-4444-4444-444444444444', (SELECT id FROM auth.users LIMIT 1), 'RestauMarket', 'Marketplace alimentaire', NULL, 'Kolwezi', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insérer des offres d'emploi variées
INSERT INTO jobs (id, company_id, posted_by_user_id, title, description, category, employment_type, salary_min, salary_max, currency, location_city, is_remote, skills, status, is_featured, created_at)
VALUES 
  -- Transport & Logistique
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', (SELECT id FROM auth.users LIMIT 1), 
   'Chauffeur VTC Kinshasa', 
   'Rejoignez notre équipe de chauffeurs partenaires Kwenda. Horaires flexibles, revenus attractifs. Formation fournie. Exigences: Minimum 2 ans d''expérience de conduite, casier judiciaire vierge requis.', 
   'Transport & Logistique', 'full_time', 200, 300, 'USD', 'Kinshasa', false, 
   ARRAY['Permis B valide', 'Smartphone', 'Bonne connaissance de Kinshasa'], 
   'active', true, NOW()),

  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', (SELECT id FROM auth.users LIMIT 1), 
   'Livreur Moto - Lubumbashi', 
   'Nous recherchons des livreurs dynamiques pour rejoindre notre flotte. Moto fournie ou possibilité d''utiliser votre propre véhicule avec prime. Expérience en livraison appréciée mais non obligatoire.', 
   'Transport & Logistique', 'full_time', 150, 250, 'USD', 'Lubumbashi', false, 
   ARRAY['Permis A', 'Connaissance ville Lubumbashi', 'Disponibilité immédiate'], 
   'active', true, NOW()),

  -- IT & Technologie
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', (SELECT id FROM auth.users LIMIT 1), 
   'Développeur Full Stack React/Node.js', 
   'Rejoignez une startup en forte croissance dans le secteur tech. Vous travaillerez sur des projets innovants pour le marché africain. Minimum 3 ans d''expérience. Portfolio de projets requis.', 
   'IT & Technologie', 'full_time', 800, 1500, 'USD', 'Kinshasa', true, 
   ARRAY['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Git'], 
   'active', false, NOW()),

  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', (SELECT id FROM auth.users LIMIT 1), 
   'UI/UX Designer', 
   'Designer créatif recherché pour concevoir des interfaces mobiles modernes. Expérience avec Figma indispensable. 2+ ans d''expérience en design d''applications mobiles requis.', 
   'IT & Technologie', 'contract', 600, 1000, 'USD', 'Kinshasa', true, 
   ARRAY['Figma', 'Adobe XD', 'Prototypage', 'Design System'], 
   'active', false, NOW()),

  -- Service Client
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', (SELECT id FROM auth.users LIMIT 1), 
   'Agent Support Client Kwenda', 
   'Nous recherchons des agents pour notre centre de support. Vous répondrez aux questions des clients et chauffeurs via chat et téléphone. Excellente communication requise. Expérience en service client souhaitée.', 
   'Service Client', 'full_time', 300, 450, 'USD', 'Kinshasa', false, 
   ARRAY['Français', 'Lingala', 'Communication', 'Patience'], 
   'active', false, NOW()),

  -- Commercial & Vente
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', (SELECT id FROM auth.users LIMIT 1), 
   'Commercial B2B - Développement Partenariats', 
   'Développez notre réseau de partenaires commerciaux. Commission attractive sur les ventes réalisées. Expérience en vente B2B obligatoire. Réseau professionnel un plus.', 
   'Commercial & Vente', 'full_time', 400, 800, 'USD', 'Lubumbashi', false, 
   ARRAY['Négociation', 'Prospection', 'Français', 'Anglais'], 
   'active', false, NOW()),

  -- Restauration & Hôtellerie
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', (SELECT id FROM auth.users LIMIT 1), 
   'Gérant de Restaurant Partenaire', 
   'Gérez un restaurant partenaire dans notre marketplace. Formation et support fournis. Expérience en restauration de 3+ ans. Sens du leadership requis.', 
   'Restauration & Hôtellerie', 'full_time', 350, 600, 'USD', 'Kolwezi', false, 
   ARRAY['Gestion d''équipe', 'Service client', 'Hygiène alimentaire'], 
   'active', false, NOW()),

  -- Stage/Junior
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', (SELECT id FROM auth.users LIMIT 1), 
   'Stage: Assistant Marketing Digital', 
   'Stage de 6 mois dans notre équipe marketing. Idéal pour étudiant en fin d''études. Étudiant en Marketing, Communication ou équivalent.', 
   'Marketing & Communication', 'internship', 100, 200, 'USD', 'Kinshasa', true, 
   ARRAY['Réseaux sociaux', 'Canva', 'Rédaction', 'Créativité'], 
   'active', false, NOW()),

  -- Temps partiel
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', (SELECT id FROM auth.users LIMIT 1), 
   'Chauffeur Week-end (Temps Partiel)', 
   'Complétez vos revenus en conduisant les week-ends. Idéal comme activité secondaire. Pas d''expérience requise. Formation assurée.', 
   'Transport & Logistique', 'part_time', 50, 150, 'USD', 'Kinshasa', false, 
   ARRAY['Permis B', 'Disponibilité week-end', 'Véhicule propre'], 
   'active', false, NOW());

-- Vérifier l'insertion
DO $$
BEGIN
  RAISE NOTICE 'Migration terminée: % entreprises et % offres insérées', 
    (SELECT COUNT(*) FROM job_companies WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444')),
    (SELECT COUNT(*) FROM jobs WHERE company_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444'));
END $$;