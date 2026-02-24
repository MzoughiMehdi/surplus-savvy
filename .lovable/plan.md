

# Correction de l'erreur 404 OAuth dans Capacitor

## Diagnostic

En lisant le code source de la bibliotheque `@lovable.dev/cloud-auth-js`, voici ce qui se passe exactement :

1. La bibliotheque detecte si l'app est dans un iframe ou non
2. Dans Capacitor, l'app n'est **pas** dans un iframe
3. La bibliotheque execute : `window.location.href = "/~oauth/initiate?provider=google&..."`
4. Cette URL relative se resout sur le domaine du WebView Capacitor : `https://69f86be0-14ac-4dad-8125-76b57ac533c8.lovableproject.com/~oauth/initiate`
5. Le proxy OAuth n'existe que sur le domaine `*.lovable.app`, pas sur `*.lovableproject.com`
6. Resultat : **404**

## Solution

Dans `AuthPage.tsx`, detecter l'environnement Capacitor et contourner la bibliotheque en construisant manuellement l'URL OAuth avec le bon domaine (`*.lovable.app`).

### Fichier : `src/pages/AuthPage.tsx`

Ajouter une constante et une fonction helper :

```typescript
const LOVABLE_PREVIEW_ORIGIN = "https://id-preview--69f86be0-14ac-4dad-8125-76b57ac533c8.lovable.app";

const handleOAuth = async (provider: "google" | "apple") => {
  const isCapacitor = !!(window as any).Capacitor;

  if (isCapacitor) {
    // Construire l'URL du broker OAuth sur le bon domaine
    const params = new URLSearchParams({
      provider,
      redirect_uri: LOVABLE_PREVIEW_ORIGIN,
    });
    // Naviguer vers le broker OAuth sur le domaine .lovable.app
    window.location.href = `${LOVABLE_PREVIEW_ORIGIN}/~oauth/initiate?${params.toString()}`;
  } else {
    // Sur le web, garder le comportement existant (popup/iframe)
    const { error } = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error(`Erreur avec ${provider} : ` + error.message);
  }
};
```

Mettre a jour les deux boutons Google et Apple pour appeler `handleOAuth("google")` et `handleOAuth("apple")` au lieu du code inline actuel.

Ajouter un `useEffect` pour rafraichir la session quand l'app revient au premier plan (apres que l'utilisateur s'est connecte dans Safari) :

```typescript
useEffect(() => {
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      supabase.auth.getSession();
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);
  return () => document.removeEventListener('visibilitychange', handleVisibility);
}, []);
```

```text
Flux dans Capacitor (corrige) :
  Bouton Google -> detecte Capacitor
    -> window.location.href vers *.lovable.app/~oauth/initiate
    -> Le proxy OAuth intercepte la requete (pas de 404)
    -> Redirection vers Google
    -> Utilisateur se connecte
    -> Callback revient sur *.lovable.app
    -> Session creee, redirect vers /home
    -> useEffect detecte la session

Flux web (inchange) :
  Bouton Google -> lovable.auth.signInWithOAuth()
    -> popup/iframe -> tokens -> session
```

## Detail technique

| Fichier | Modification |
|---|---|
| `src/pages/AuthPage.tsx` | Ajouter `handleOAuth()` avec detection Capacitor, utiliser l'URL absolue `*.lovable.app` pour le broker OAuth, ajouter listener `visibilitychange` |

## Apres ces modifications

1. Exporter vers GitHub et faire `git pull`
2. `npx cap sync`
3. `npx cap run ios`

