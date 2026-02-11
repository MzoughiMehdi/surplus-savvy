

# Corriger le bouton "Configurer paiement" qui semble ne rien faire

## Probleme

L'appel API fonctionne parfaitement (statut 200, URL Stripe renvoyee). Cependant, le code utilise `window.open(data.url, "_blank")` pour ouvrir le lien Stripe Connect dans un nouvel onglet. Les navigateurs bloquent les popups declenchees par du code asynchrone (car le clic utilisateur est "perdu" apres l'appel reseau).

## Solution

Remplacer `window.open(url, "_blank")` par `window.location.href = url` pour rediriger directement l'utilisateur vers la page d'onboarding Stripe, dans le meme onglet. C'est coherent avec le flux de checkout qui utilise deja `window.location.href`.

## Modification

### `src/pages/Dashboard.tsx` - Ligne 106

```typescript
// AVANT :
if (data?.url) window.open(data.url, "_blank");

// APRES :
if (data?.url) window.location.href = data.url;
```

## Fichier modifie

| Fichier | Changement |
|---------|-----------|
| `src/pages/Dashboard.tsx` | Remplacement de `window.open` par `window.location.href` dans `handleSetupConnect` |

## Impact

Le commercant sera redirige directement vers la page Stripe Connect au lieu d'un popup bloque. Apres la configuration, Stripe redirigera vers `/dashboard` (deja configure comme `return_url`).

