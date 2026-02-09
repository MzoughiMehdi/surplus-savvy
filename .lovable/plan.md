

# Corriger la navigation, le mode maintenance et ajouter le lien partenaire

## 3 problemes a resoudre

### 1. Bouton "Retour" sur la page de connexion ramene vers l'appli au lieu de la page d'accueil

Le bouton "Retour" dans `AuthPage.tsx` fait `navigate("/home")` en dur. Il devrait revenir a la page precedente.

**Correction** : Remplacer `navigate("/home")` par `navigate("/")` pour toujours revenir a la page de bienvenue (point d'entree naturel avant connexion).

### 2. En mode maintenance, la page d'accueil (WelcomePage) ne doit PAS s'afficher

Actuellement, en mode maintenance, la route `/` (WelcomePage) est masquee par le wildcard `*` qui affiche la MaintenancePage. C'est le bon comportement. Mais le lien "Administration" en bas de la page de maintenance permet deja d'acceder a `/auth`. Donc seuls `/auth` et `/admin` restent accessibles, tout le reste (y compris `/`) affiche la page de maintenance. C'est deja correct.

Aucune modification necessaire pour le mode maintenance -- il fonctionne deja comme souhaite.

### 3. Ajouter le bouton "Vous etes commercant ? Devenir partenaire" sur la page d'accueil

Ajouter un lien sous les boutons existants de la WelcomePage, similaire au style des autres liens secondaires.

## Modifications techniques

### Fichier `src/pages/AuthPage.tsx`
- Ligne 157 : remplacer `navigate("/home")` par `navigate("/")`

### Fichier `src/pages/WelcomePage.tsx`
- Ajouter un bouton/lien apres "Continuer en tant qu'invite" avec le texte : **"Vous etes commercant ? Devenir partenaire"**
- Ce bouton navigue vers `/auth?mode=merchant-signup` (le mode d'inscription commercant qui existe deja dans AuthPage)
- Style : texte discret en blanc/70, avec "Devenir partenaire" en couleur accent pour attirer l'attention sans surcharger

