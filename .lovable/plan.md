

# Correction : retour dans l'app apres OAuth (Capacitor)

## Le probleme actuel

Apres avoir clique sur "Continuer avec Google/Apple", voici ce qui se passe :

1. Le WebView de l'app navigue vers `lovable.app/~oauth/initiate` (correct, pas de 404)
2. L'utilisateur se connecte sur Google/Apple (correct)
3. Le proxy OAuth redirige vers `redirect_uri` qui est `lovable.app` (le probleme !)
4. L'utilisateur se retrouve connecte **sur le site web** dans le navigateur, pas dans l'app

## La solution

Changer le `redirect_uri` pour qu'il pointe vers le serveur du WebView Capacitor (`lovableproject.com`). Ainsi, apres l'authentification, le proxy OAuth redirigera l'utilisateur **dans l'app** avec le token.

```text
Flux actuel (KO) :
  App -> lovable.app/~oauth/initiate -> Google -> lovable.app (navigateur)
  L'utilisateur reste sur le navigateur, pas dans l'app

Flux corrige :
  App -> lovable.app/~oauth/initiate -> Google -> lovableproject.com (WebView)
  L'utilisateur revient dans l'app avec le token
```

## Modification

### Fichier : `src/pages/AuthPage.tsx`

Modifier la fonction `handleOAuth` pour utiliser l'URL du serveur Capacitor comme `redirect_uri` :

```typescript
const handleOAuth = async (provider: "google" | "apple") => {
  const isCapacitor = !!(window as any).Capacitor;
  if (isCapacitor) {
    const params = new URLSearchParams({
      provider,
      redirect_uri: window.location.origin, // Pointe vers lovableproject.com (le WebView)
    });
    // Naviguer vers le proxy OAuth sur lovable.app (ou il existe)
    window.location.href = `${LOVABLE_PREVIEW_ORIGIN}/~oauth/initiate?${params.toString()}`;
  } else {
    const { error } = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error(`Erreur avec ${provider} : ` + error.message);
  }
};
```

Le changement cle : `redirect_uri` passe de `LOVABLE_PREVIEW_ORIGIN` (lovable.app) a `window.location.origin` (lovableproject.com, l'URL du WebView Capacitor).

L'initiation OAuth continue de pointer vers `LOVABLE_PREVIEW_ORIGIN` (la ou le proxy existe), mais le retour apres authentification se fait vers l'app.

## Resume

| Fichier | Modification |
|---|---|
| `src/pages/AuthPage.tsx` | Changer `redirect_uri` de `LOVABLE_PREVIEW_ORIGIN` a `window.location.origin` dans le bloc Capacitor |

## Apres ces modifications

1. Exporter vers GitHub et faire `git pull`
2. `npx cap sync`
3. `npx cap run ios`

