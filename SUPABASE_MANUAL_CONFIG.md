# 🔐 CONFIGURATION MANUELLE SUPABASE REQUISE

## ⚠️ ACTIONS IMPORTANTES À EFFECTUER

### **1. Activer la Protection des Mots de Passe (CRITIQUE)**

**Navigation**: Dashboard Supabase > Authentication > Settings > Security

1. Aller sur https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/auth/providers
2. Scroll vers "Password Protection" 
3. ✅ **Activer**: "Check for leaked passwords"
4. ✅ **Activer**: "Require password confirmation for sensitive operations"

**Impact**: Protège contre les mots de passe compromis dans les breaches

---

### **2. Optimiser la Sécurité OTP**

**Navigation**: Dashboard Supabase > Authentication > Settings > Auth

1. Aller sur https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/auth/providers
2. Section "Email OTP"
3. ⚠️ **Réduire**: OTP expiry time à **1 heure** (au lieu de 24h)
4. ✅ **Vérifier**: Rate limiting activé

**Impact**: Réduit les risques d'interception OTP

---

### **3. Vérifier les Secrets Edge Functions**

**Navigation**: Dashboard Supabase > Edge Functions > Settings

1. Aller sur https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/settings/functions
2. Vérifier que ces secrets sont configurés:
   - ✅ `GOOGLE_MAPS_API_KEY`
   - ✅ `OPENAI_API_KEY` (si utilisé)
   - ✅ `ELEVENLABS_API_KEY` (si utilisé)

**Impact**: Fonctionnalités géolocalisation et IA

---

### **4. Surveiller les Logs de Sécurité**

**Navigation**: Dashboard Supabase > Logs & Monitoring

1. **Database Logs**: https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/logs/postgres-logs
2. **Auth Logs**: https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/logs/auth-logs
3. **Edge Function Logs**: https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/logs/functions

**À Surveiller**:
- ❌ Tentatives d'authentification suspectes
- ❌ Échecs RLS Policy
- ❌ Erreurs Edge Functions récurrentes

---

### **5. Backup et Recovery Configuration**

**Navigation**: Dashboard Supabase > Settings > General

1. ✅ **Point-in-time Recovery**: Activé par défaut (garde 7 jours)
2. ✅ **Daily Backups**: Configurés automatiquement
3. ⚠️ **Test Recovery**: Effectuer un test trimestriel

---

## 📋 CHECKLIST POST-CONFIGURATION

### **Sécurité** ✅
- [ ] Protection mots de passe activée
- [ ] OTP expiry réduit à 1h
- [ ] Secrets Edge Functions vérifiés
- [ ] Rate limiting configuré
- [ ] Logs monitoring configuré

### **Performance** ✅  
- [ ] Database indexing optimisé
- [ ] Edge Functions monitoring
- [ ] RLS policies testées
- [ ] Connection pooling configuré

### **Backup** ✅
- [ ] Point-in-time recovery activé
- [ ] Backups automatiques vérifiés
- [ ] Recovery procedure documentée

---

## 🚨 ALERTES À CONFIGURER

### **Dashboard Supabase > Project Settings > Integrations**

1. **Slack/Discord**: Intégrer alertes critiques
2. **Email**: Notifications échecs de backup
3. **Webhook**: Monitoring externe si nécessaire

### **Seuils d'Alerte Recommandés**
- ❌ **Database CPU**: >80% pendant 5min
- ❌ **Auth Failures**: >100 par heure
- ❌ **Edge Function Errors**: >10% error rate
- ❌ **RLS Policy Violations**: >5 par minute

---

## 📖 LIENS UTILES

- **Dashboard Auth**: https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/auth/users
- **Database Editor**: https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/editor
- **Edge Functions**: https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/functions
- **Logs & Monitoring**: https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/logs/explorer

---

## ⏱️ TEMPS ESTIMÉ: 10 minutes

Ces configurations manuelles sont **critiques** pour la sécurité en production. 
Effectuer immédiatement avant le lancement commercial.