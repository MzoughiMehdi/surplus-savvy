

# Corriger la redirection apres deconnexion du compte commercant

## Probleme

Dans `src/pages/Dashboard.tsx` (ligne 413), le bouton de deconnexion fait :

```typescript
onClick={() => { signOut(); navigate("/"); }}
```

Apres la deconnexion, le commercant est redirige vers `/` (la page d'accueil WelcomePage) qui affiche les boutons d'inscription et de creation de compte. C'est deroutant car le commercant s'attend a atterrir sur une page de connexion.

## Solution

Modifier la redirection apres deconnexion pour envoyer vers `/auth` (la page de connexion) au lieu de `/` (la page d'accueil).

De plus, `signOut()` est appele sans `await`, ce qui peut causer des problemes de timing avec la navigation.

### Fichier : `src/pages/Dashboard.tsx` (ligne 413)

```typescript
// AVANT :
onClick={() => { signOut(); navigate("/"); }}

// APRES :
onClick={async () => { await signOut(); navigate("/auth"); }}
```

Cela garantit que :
1. La session est bien detruite avant la navigation
2. Le commercant atterrit sur la page de connexion, pas sur la page d'accueil grand public

## Fichiers modifies

| Fichier | Changement |
|---------|-----------|
| `src/pages/Dashboard.tsx` | Redirection vers `/auth` au lieu de `/`, et `await` sur `signOut()` |
