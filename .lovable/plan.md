
# Ameliorer la redirection apres connexion Google/Apple

## Probleme
Quand vous vous connectez via Google, le popup se ferme mais l'application ne reagit pas automatiquement : pas de redirection, pas de message de bienvenue.

## Solution
Ajouter une detection automatique du retour de session OAuth dans la page d'authentification. Quand le `AuthProvider` detecte une nouvelle session (via `onAuthStateChange`), la page `/auth` redirigera automatiquement vers l'accueil avec un toast "Bienvenue !".

## Modifications techniques

### Fichier : `src/pages/AuthPage.tsx`
- Importer `useAuth` pour surveiller l'etat de la session
- Ajouter un `useEffect` qui detecte quand `user` passe de `null` a une valeur (session recuperee apres OAuth)
- Quand un utilisateur est detecte et qu'on est sur `/auth`, rediriger automatiquement vers `/` avec un `toast.success("Bienvenue !")` incluant le prenom si disponible
- Cela couvre le cas ou l'utilisateur revient sur l'onglet apres le popup Google/Apple

### Fichier : `src/hooks/useAuth.tsx`
- Ajouter la detection de l'evenement `SIGNED_IN` dans `onAuthStateChange`
- Quand l'evenement est `SIGNED_IN`, stocker un flag temporaire pour permettre a la page Auth de reagir au retour OAuth
