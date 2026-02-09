

# Correction des bugs 3, 5 et 10

## Bug 3 : Bouton erreur CheckoutReturnPage pointe vers `/` au lieu de `/home`

**Fichier** : `src/pages/CheckoutReturnPage.tsx` (ligne 73)

**Probleme** : Quand le paiement echoue, le bouton "Retour a l'accueil" redirige vers `/` (landing page) au lieu de `/home` (app principale).

**Correction** : Changer `navigate("/")` en `navigate("/home")`.

---

## Bug 5 : Pas de prompt de connexion sur OrdersPage pour les invites

**Fichier** : `src/pages/OrdersPage.tsx`

**Probleme** : Un utilisateur non connecte qui accede a l'onglet "Commandes" voit un ecran vide ("Aucune reservation") au lieu d'un prompt de connexion, contrairement a FavoritesPage qui gere ce cas.

**Correction** : Ajouter un bloc conditionnel avant le contenu principal, identique au pattern de FavoritesPage :
- Icone ShoppingBag centree
- Titre "Connectez-vous pour voir vos commandes"
- Sous-titre explicatif
- Bouton "Se connecter" qui redirige vers `/auth`

---

## Bug 10 : `navigate(-1)` non fiable dans MerchantOnboarding

**Fichier** : `src/pages/MerchantOnboarding.tsx` (ligne 144)

**Probleme** : Le bouton "Retour" en haut de la page utilise `navigate(-1)` qui remonte dans l'historique du navigateur. Si l'utilisateur arrive depuis un lien email (confirmation), il n'y a pas de page precedente, ce qui provoque un comportement imprevisible.

**Correction** : Remplacer `navigate(-1)` par `navigate("/home")` pour garantir une navigation deterministe vers l'application.

---

## Resume des modifications

| Bug | Fichier | Changement |
|-----|---------|------------|
| 3 | `CheckoutReturnPage.tsx` L73 | `navigate("/")` -> `navigate("/home")` |
| 5 | `OrdersPage.tsx` | Ajout prompt connexion pour invites |
| 10 | `MerchantOnboarding.tsx` L144 | `navigate(-1)` -> `navigate("/home")` |

