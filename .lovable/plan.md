

# Comportement session invite vs utilisateur connecte (style TooGoodToGo / UberEats)

## Objectif

Reproduire le comportement des apps comme TooGoodToGo ou UberEats :
- **Utilisateur connecte** : revient directement sur `/home`, session persistante
- **Invite** : session ephemere, quand il quitte et revient il retombe sur la page d'accueil (WelcomePage)

## Changements

### 1. Supprimer le stockage persistant du mode invite

**Fichier** : `src/pages/WelcomePage.tsx`

- Retirer le `localStorage.setItem("guest_mode", "true")` du bouton "Continuer en tant qu'invite"
- Retirer la verification `localStorage.getItem("guest_mode")` dans le `useEffect`
- Utiliser `sessionStorage` a la place : la session invite disparait quand l'utilisateur ferme l'onglet/navigateur
- Le bouton navigue simplement vers `/home` avec un flag `sessionStorage` pour la duree de la visite

### 2. Nettoyer le guest_mode a la deconnexion

**Fichier** : `src/pages/ProfilePage.tsx`

- Ajouter `sessionStorage.removeItem("guest_mode")` dans `handleSignOut` pour couvrir le cas ou l'utilisateur se deconnecte sans fermer l'onglet

## Comportement final

```text
Invite :
  Ouvre l'app -> WelcomePage
  Clique "Continuer en invite" -> /home (sessionStorage flag)
  Ferme l'onglet/navigateur -> flag supprime automatiquement
  Reouvre l'app -> WelcomePage (pas de flag)

Utilisateur connecte :
  Ouvre l'app -> WelcomePage detecte user -> redirect /home
  Ferme l'onglet/navigateur -> session Supabase persistante
  Reouvre l'app -> WelcomePage detecte user -> redirect /home
```

## Details techniques

**WelcomePage.tsx** : Remplacer `localStorage` par `sessionStorage` pour le guest_mode :
- Ligne 16 : `sessionStorage.getItem("guest_mode")` au lieu de `localStorage`
- Ligne 71 : `sessionStorage.setItem("guest_mode", "true")` au lieu de `localStorage`

**ProfilePage.tsx** : Dans `handleSignOut`, ajouter `sessionStorage.removeItem("guest_mode")` par securite.

