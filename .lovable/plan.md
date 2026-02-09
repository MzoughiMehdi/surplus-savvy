
# Corriger la redirection admin en mode maintenance

## Probleme
Quand le mode maintenance est actif et qu'un utilisateur est deja connecte (ex: Pedro via Google), cliquer sur "Administration" redirige vers `/` au lieu de `/admin/settings`. Comme `/` est bloque par la maintenance, l'utilisateur tourne en boucle sur la page de maintenance.

## Cause
Le `useEffect` dans `AuthPage.tsx` (ligne 23-30) detecte que l'utilisateur est connecte et redirige automatiquement vers `/`, sans verifier :
1. Si le mode maintenance est actif
2. Si le parametre `redirect=admin` est present
3. Si l'utilisateur est admin

## Solution
Modifier le `useEffect` de redirection automatique dans `AuthPage.tsx` pour :
1. Verifier le parametre `redirect=admin` dans l'URL
2. Si `redirect=admin` : verifier si l'utilisateur est admin (via `isAdmin` de `useAuth`)
3. Si admin : rediriger vers `/admin/settings` au lieu de `/`
4. Si pas admin : deconnecter l'utilisateur (pour permettre la connexion admin) et rester sur `/auth`

## Modifications techniques

### Fichier : `src/pages/AuthPage.tsx`
- Importer `isAdmin` depuis `useAuth` (deja disponible dans le hook)
- Modifier le `useEffect` de redirection automatique :
  - Lire le parametre `redirect` de l'URL
  - Si `redirect === "admin"` et `isAdmin` est `true` : naviguer vers `/admin/settings`
  - Si `redirect === "admin"` et `isAdmin` est `false` : appeler `signOut()` pour deconnecter l'utilisateur non-admin, et rester sur la page de connexion (ne pas rediriger)
  - Sinon (pas de `redirect=admin`) : comportement actuel, rediriger vers `/`
- Importer `signOut` depuis `useAuth`
