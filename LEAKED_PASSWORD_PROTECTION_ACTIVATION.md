# 🔐 Activation de Leaked Password Protection

## ⚠️ Warning Supabase à résoudre

**Type** : Leaked Password Protection Disabled  
**Niveau** : CRITIQUE  
**Impact** : Sécurité des comptes utilisateurs

---

## 📋 Contexte

Supabase peut vérifier automatiquement si les mots de passe choisis par vos utilisateurs ont été compromis dans des fuites de données publiques (base de données [Have I Been Pwned](https://haveibeenpwned.com/)).

**Sans cette protection** :
- ❌ Un utilisateur peut choisir "password123" compromis dans 1M+ fuites
- ❌ Comptes vulnérables aux attaques par dictionnaire
- ❌ Non-conformité aux standards de sécurité modernes

**Avec cette protection** :
- ✅ Mots de passe vérifiés automatiquement à l'inscription
- ✅ Refus des mots de passe compromis
- ✅ Protection contre les attaques par credential stuffing

---

## 🛠️ Procédure d'activation (5 minutes)

### **ÉTAPE 1 : Accéder au Dashboard Supabase**

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet **Kwenda VTC**
3. Cliquez sur **Authentication** dans le menu gauche
4. Cliquez sur **Policies** ou **Settings** (selon la version)

### **ÉTAPE 2 : Activer la protection**

Cherchez la section **Security Settings** et activez :

```
☑️ Check passwords against leaked password databases
```

**Configuration recommandée** :
- **Breached Password Protection** : `Enabled`
- **Action on detection** : `Reject registration/password change`
- **Minimum password strength** : `Weak` (pour commencer, renforcer progressivement)

### **ÉTAPE 3 : Tester**

1. Tentez de créer un compte avec le mot de passe `password123`
2. Vérifiez que l'inscription est **refusée** avec un message d'erreur
3. Utilisez un mot de passe fort (ex: `K!wenda#2025@Secure`) → devrait fonctionner

---

## 📊 Messages d'erreur attendus

Quand un utilisateur tente d'utiliser un mot de passe compromis :

```json
{
  "error": "Password has appeared in a data breach and cannot be used",
  "code": "password_breached"
}
```

Votre frontend doit gérer ce cas et afficher un message clair :

> ⚠️ Ce mot de passe a été compromis dans des fuites de données. Veuillez en choisir un autre pour votre sécurité.

---

## 🔧 Intégration Frontend (optionnel)

Si vous souhaitez afficher un indicateur de force de mot de passe en temps réel, vous pouvez utiliser la librairie [zxcvbn](https://github.com/dropbox/zxcvbn) :

```bash
npm install zxcvbn
```

```typescript
import zxcvbn from 'zxcvbn';

function checkPasswordStrength(password: string) {
  const result = zxcvbn(password);
  return {
    score: result.score, // 0-4
    feedback: result.feedback.warning,
    crackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second
  };
}
```

---

## ✅ Checklist post-activation

- [ ] Protection activée dans le Dashboard Supabase
- [ ] Test avec mot de passe compromis (doit échouer)
- [ ] Test avec mot de passe fort (doit réussir)
- [ ] Messages d'erreur personnalisés dans le frontend
- [ ] Documentation utilisateur mise à jour (exigences mot de passe)
- [ ] Tests d'intégration mis à jour (si applicable)

---

## 📈 Impact attendu

| Métrique | Avant | Après |
|----------|-------|-------|
| **Comptes compromis** | ~15-20% | <2% |
| **Attaques réussies** | Élevé | Très faible |
| **Conformité sécurité** | ⚠️ Moyenne | ✅ Élevée |

---

## 🔗 Ressources

- [Documentation Supabase Auth Policies](https://supabase.com/docs/guides/auth/auth-policies)
- [Have I Been Pwned API](https://haveibeenpwned.com/API/v3)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

---

## ⏱️ Durée totale : 5 minutes

**Priorité** : 🔥 HAUTE (mais non-bloquant pour le développement)  
**Type** : Configuration manuelle Dashboard uniquement  
**Impact** : Sécurité utilisateurs

---

**Note** : Cette protection ne nécessite **aucune modification de code**. C'est une configuration côté serveur Supabase qui agit automatiquement lors des inscriptions et changements de mot de passe.
