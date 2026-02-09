

# Corriger la connexion admin en mode maintenance

## Probleme
Apres la connexion admin, le `useEffect` dans `AuthPage` s'execute **avant** que le role admin soit charge. `fetchProfile` utilise `setTimeout(..., 0)` donc `loading` passe a `false` immediatement tandis que `isAdmin` est encore `false`. Le useEffect voit `isAdmin = false` et appelle `signOut()`, deconnectant l'admin en boucle.

## Solution

### 1. Modifier `src/hooks/useAuth.tsx`
- Ajouter un state `profileLoading` (boolean, defaut `false`)
- Dans `fetchProfile` : supprimer le `setTimeout`, mettre `profileLoading = true` au debut, `false` a la fin (apres les 2 requetes profil + roles)
- Exposer `profileLoading` dans le contexte AuthContext

### 2. Modifier `src/pages/AuthPage.tsx`
- Recuperer `profileLoading` depuis `useAuth()`
- Dans le `useEffect` de redirection, ajouter la condition : ne rien faire tant que `profileLoading` est `true`
- Cela garantit que `isAdmin` est fiable avant de decider de rediriger ou deconnecter

```text
Connexion admin
      |
  loading = false, user present
      |
  profileLoading = true (roles en cours)
      |
  useEffect attend...
      |
  profileLoading = false, isAdmin = true
      |
  -> navigate("/admin/settings")
```

