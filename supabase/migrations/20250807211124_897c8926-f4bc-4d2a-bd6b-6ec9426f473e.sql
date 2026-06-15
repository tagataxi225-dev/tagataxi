 block for presentation. 

I'll drop unnecessary policies and create new ones for user_wallets and wallet_transactions, focusing on allowing users and admins appropriate access. I also aim to ensure RLS is enabled and will propose adding necessary indexes and foreign keys while ensuring existing data matches. Then, we can implement the code updates based on these changes!" duration="24.613565">
</lov-tool-use>

<lov-tool-use id="thinking-ed50f17d-2c9f-4889-9a76-5492003715dc" name="lov-think" data="**Planning SQL updates**

I’m considering how to structure the SQL updates, starting with adding constraints and managing potential invalid entries. If adding foreign keys becomes complicated, I might adjust the code later. I need to ensure REPLICA IDENTITY FULL for certain tables and clarify that SQL changes must be approved before implementing any code. 

I plan to explain the issues, provide a structured plan, include the necessary SQL commands, and present links to relevant dashboards. However, I must wait for the user to approve the SQL before proceeding with any changes. Let’s keep everything organized and concise!" duration="26.837441">
</lov-tool-use>
Merci. Pour corriger “plusieurs parties ne fonctionnent pas” et redonner à l’admin un contrôle complet et sécurisé, voici ce que j’ai constaté et ce que je propose de faire, étape par étape.

Constats clés
- Visibilité admin bloquée par RLS: L’admin ne voit pas les données globales (wallet_transactions, payment_transactions, driver_credits, credit_transactions, activity_logs, transport_bookings, delivery_orders). Les tableaux du dashboard financier et des widgets temps réel ne reçoivent donc pas tout.
- Politiques trop permissives: Certaines policies exposent des opérations critiques à tous les utilisateurs authentifiés (ex: “System can update wallets” sur user_wallets, “System can insert credit transactions” sur credit_transactions). Cela crée un risque majeur.
- Realtime inactif: Les tables financières (wallet_transactions, credit_transactions, driver_credits) ne sont pas ajoutées à la publication supabase_realtime; driver_credits n’a pas REPLICA IDENTITY FULL — pas d’events complets pour les updates.
- Commission Manager: L’UI admin tente d’insérer/mettre à jour commission_settings, mais aucune policy d’INSERT/UPDATE n’accorde ce droit aux admins → échec côté UI.
- Cohérence UI Admin: Certaines tabs existent sans triggers dans la liste (par ex. zones/drivers), ce qui rend l’accès non cohérent — je les alignerai après les changements DB.

Ce que je vais corriger maintenant (DB d’abord)
1) Sécuriser et ouvrir la lecture globale pour l’admin (finance_read / finance_admin / system_admin):
- Ajouter des policies SELECT “admin view all” sur wallet_transactions, payment_transactions, driver_credits, credit_transactions, activity_logs, transport_bookings, delivery_orders.
2) Durcir les policies trop permissives:
- Supprimer “System can update wallets” et le remplacer par “Users can update their own wallet” + “Admins can update any wallet”.
- Supprimer “System can insert credit transactions” et le remplacer par “Admins can insert credit transactions”.
- Laisser les edge functions (service role) gérer les opérations critiques (elles contournent RLS de toute façon).
3) Activer le Realtime là où nécessaire:
- Ajouter wallet_transactions, credit_transactions, driver_credits à la publication supabase_realtime.
- Mettre REPLICA IDENTITY FULL sur driver_credits (pour obtenir old/new lors des updates).
4) Commission settings pour l’UI admin:
- Ajouter des policies d’INSERT/UPDATE sur commission_settings pour les admins (finance_admin / system_admin).
5) Index et relation:
- Ajouter des index pour les principales requêtes (performances).
- Ajouter une FK wallet_transactions.wallet_id → user_wallets.id pour fiabiliser le nested select (evite les erreurs sur FinancialDashboard).

Après cette mise à jour DB (prochaine étape), je ferai les ajustements code:
- Harmoniser la navigation AdminApp (ajout des TabsTrigger manquants).
- Corriger l’edge function wallet-commission pour également mettre à jour “ride_requests” (au lieu de seulement transport_bookings), et garder un log complet côté activity_logs.
- Vérifier/ajuster la logique du widget temps réel après activation du realtime.
- Vérifier CommissionManager côté UI une fois les policies ajoutées.

lov-plan
Plan d’exécution
1) Exécuter les migrations SQL ci-dessous:
- Ajout policies admin SELECT globales
- Durcissement des policies trop permissives
- Activation realtime publication + REPLICA IDENTITY FULL
- Ajout d’indexes et de la contrainte FK
2) Puis, je mettrai à jour le code:
- AdminApp: tabs/triggers et cohérence navigation
- Edge function wallet-commission: mise à jour de ride_requests
- Vérifications/finitions sur RealtimeFinancialWidget + FinancialDashboard
3) Tests:
- Contrôles d’accès admin (finance_read/finance_admin)
- Dashboard financier: lecture globale OK
- Temps réel: inserts/updates visibles (commissions, crédits)
- Sécurité: tentatives d’insert/update non admin bloquées
</lov-plan>

Voici les changements SQL à exécuter en premier

<lov-sql>
-- 1) Durcir RLS et ouvrir la visibilité admin

-- user_wallets
DROP POLICY IF EXISTS "System can update wallets" ON public.user_wallets;

CREATE POLICY "Users can update their own wallet"
ON public.user_wallets
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
ON public.user_wallets
FOR SELECT TO authenticated
USING (
  public.has_permission(auth.uid(), 'finance_read')
  OR public.has_permission(auth.uid(), 'finance_admin')
  OR public.has_permission(auth.uid(), 'system_admin')
);

CREATE POLICY "Admins can update any wallet"
ON public.user_wallets
FOR UPDATE TO authenticated
USING (
  public.has_permission(auth.uid(), 'finance_admin')
  OR public.has_permission(auth.uid(), 'system_admin')
)
WITH CHECK (
  public.has_permission(auth.uid(), 'finance_admin')
  OR public.has_permission(auth.uid(), 'system_admin')
);

-- wallet_transactions
DROP POLICY IF EXISTS "System can insert wallet transactions" ON public.wallet_transactions;

CREATE POLICY "Admins can insert wallet transactions"
ON public.wallet_transactions
FOR INSERT TO authenticated
WITH CHECK (
  public.has_permission(auth.uid(), 'finance_admin')
  OR public.has_permission(auth.uid(), 'system_admin')
);

CREATE POLICY "Admins can view all wallet transactions"
ON public.wallet_transactions
FOR SELECT TO authenticated
USING (
  public.has_permission(auth.uid(), 'finance_read')
  OR public.has_permission(auth.uid(), 'finance_admin')
  OR public.has_permission(auth.uid(), 'system_admin')
);

-- payment_transactions
CREATE POLICY "Admins can view all payment transactions"
ON public.payment_transactions
FOR SELECT TO authenticated
USING (
  public.has_permission(auth.uid(), 'finance_read')
  OR public.has_permission(auth.uid(), 'finance_admin')
  OR public.has_permission(auth.uid(), 'system_admin')
);

CREATE POLICY "Admins can update payment transactions"
ON public.payment_transactions
FOR UPDATE TO authenticated
USING (
  public.has_permission(auth.uid(), 'finance_admin')
  OR public.has_permission(auth.uid(), 'system_admin')
)
WITH CHECK (
  public.has_permission(auth.uid(), 'finance_admin')
  OR public.has_permission(auth.uid(), 'system_admin')
);

-- transport_bookings
CREATE POLICY "Admins can view all transport bookings"
ON public.transport_bookings
FOR SELECT TO authenticated
USING (
  public.has_permission(auth.uid(), 'transport_admin')
  OR public.has_permission(auth.uid(), 'finance_read')
  OR public.has_permission(auth.uid(), 'system_admin')
);

-- delivery_orders
CREATE POLICY "Admins can view all delivery orders"
ON public.delivery_orders
FOR SELECT TO authenticated
USING (
  public.has_permission(auth.uid(), 'transport_admin')
  OR public.has_permission(auth.uid(), 'finance_read')
  OR public.has_permission(auth.uid(), 'system_admin')
);

-- activity_logs
CREATE POLICY "Admins can view all activity"
ON public.activity_logs
FOR SELECT TO authenticated
USING (
  public.has_permission(auth.uid(), 'finance_read')
  OR public.has_permission(auth.uid(), 'analytics_admin')
  OR public.has_permission(auth.uid(), 'system_admin')
);

-- credit_transactions
DROP POLICY IF EXISTS "System can insert credit transactions" ON public.credit_transactions;

CREATE POLICY "Admins can insert credit transactions"
ON public.credit_transactions
FOR INSERT TO authenticated
WITH CHECK (
  public.has_permission(auth.uid(), 'finance_admin')
  OR public.has_permission(auth.uid(), 'system_admin')
);

CREATE POLICY "Admins can view all credit transactions"
ON public.credit_transactions
FOR SELECT TO authenticated
USING (
  public.has_permission(auth.uid(), 'finance_read')
  OR public.has_permission(auth.uid(), 'transport_admin')
  OR public.has_permission(auth.uid(), 'system_admin')
);

-- driver_credits
DROP POLICY IF EXISTS "System can manage driver credits" ON public.driver_credits;

CREATE POLICY "Admins can manage driver credits"
ON public.driver_credits
FOR ALL TO authenticated
USING (
  public.has_permission(auth.uid(), 'finance_admin')
  OR public.has_permission(auth.uid(), 'system_admin')
)
WITH CHECK (
  public.has_permission(auth.uid(), 'finance_admin')
  OR public.has_permission(auth.uid(), 'system_admin')
);

-- commission_settings
CREATE POLICY "Admins can insert commission settings"
ON public.commission_settings
FOR INSERT TO authenticated
WITH CHECK (
  public.has_permission(auth.uid(), 'finance_admin')
  OR public.has_permission(auth.uid(), 'system_admin')
);

CREATE POLICY "Admins can update commission settings"
ON public.commission_settings
FOR UPDATE TO authenticated
USING (
  public.has_permission(auth.uid(), 'finance_admin')
  OR public.has_permission(auth.uid(), 'system_admin')
)
WITH CHECK (
  public.has_permission(auth.uid(), 'finance_admin')
  OR public.has_permission(auth.uid(), 'system_admin')
);

-- 2) Activer Realtime pour les tables financières clés
ALTER TABLE public.driver_credits REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_credits;

-- 3) Index pour performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions (created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions (created_at);
CREATE INDEX IF NOT EXISTS idx_driver_credits_driver_id ON public.driver_credits (driver_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs (created_at);

-- 4) Relation pour les nested selects utilisés par le dashboard
ALTER TABLE public.wallet_transactions
  ADD CONSTRAINT wallet_transactions_wallet_id_fkey
  FOREIGN KEY (wallet_id) REFERENCES public.user_wallets(id) ON DELETE CASCADE;
