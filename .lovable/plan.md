

# Correction OAuth Capacitor : redirect_uri autorisé + retour dans l'app

## Diagnostic

Le proxy OAuth n'accepte que les `redirect_uri` sur le domaine `*.lovable.app`. Or, dans Capacitor, `window.location.origin` vaut `*.lovableproject.com`, ce qui provoque l'erreur "redirection Uri is not allowed" avant meme d'arriver sur Google.

## Solution : flux en 2 etapes

```text
1. App Capacitor (lovableproject.com)
   -> Navigue vers lovable.app/~oauth/initiate
      avec redirect_uri = lovable.app/auth  (domaine autorise)

2. OAuth se fait (Google/Apple)
   -> Retour sur lovable.app/auth#access_token=...&refresh_token=...

3. Le code AuthPage sur lovable.app detecte les tokens dans le hash
   -> supabase.auth.setSession() les enregistre
   -> L'utilisateur est connecte sur lovable.app
   -> Comme le WebView Capacitor charge lovable.app, la session est active

4. Redirection vers /home dans l'app
```

Le point cle : le `redirect_uri` doit pointer vers `LOVABLE_PREVIEW_ORIGIN` (le seul domaine autorise), pas vers `window.location.origin`.

## Modification

### Fichier : `src/pages/AuthPage.tsx`

Modifier la fonction `handleOAuth` :

```typescript
const handleOAuth = async (provider: "google" | "apple") => {
  const isCapacitor = !!(window as any).Capacitor;
  if (isCapacitor) {
    const params = new URLSearchParams({
      provider,
      redirect_uri: LOVABLE_PREVIEW_ORIGIN,  // Domaine autorise par le proxy
    });
    window.location.href = `${LOVABLE_PREVIEW_ORIGIN}/~oauth/initiate?${params.toString()}`;
  } else {
    const { error } = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error(`Erreur avec ${provider} : ` + error.message);
  }
};
```

Le changement : `redirect_uri` passe de `window.location.origin` (lovableproject.com, refuse) a `LOVABLE_PREVIEW_ORIGIN` (lovable.app, autorise).

Apres l'authentification, l'utilisateur atterrira sur `lovable.app` avec la session active. Le WebView Capacitor charge aussi depuis ce serveur, donc la session sera detectee par le listener `onAuthStateChange` et `visibilitychange` deja en place.

## Resume

| Fichier | Modification |
|---|---|
| `src/pages/AuthPage.tsx` | Changer `redirect_uri` de `window.location.origin` a `LOVABLE_PREVIEW_ORIGIN` dans le bloc Capacitor |

## Apres ces modifications

1. Exporter vers GitHub et faire `git pull`
2. `npx cap sync`
3. `npx cap run ios`

