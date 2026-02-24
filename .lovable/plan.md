

# OAuth Capacitor avec Deep Link : retour dans l'app

## Le probleme

La session OAuth se cree dans Safari (navigateur externe), mais le WebView Capacitor a son propre stockage isole. L'app ne "voit" jamais la session. Il faut un **deep link** pour ramener les tokens OAuth directement dans le WebView.

## Ce qu'il faut faire

### Etape 1 : Configurer le deep link iOS dans Xcode (manuel, cote utilisateur)

Dans Xcode :
- Target App -> Info -> URL Types -> +
- Identifier : `com.mehdimzoughi.surplussavvy`
- URL Schemes : `surplussavvy`

Cela permet d'ouvrir l'app via `surplussavvy://auth/callback#access_token=...`

### Etape 2 : Installer `@capacitor/app`

Ajouter la dependance `@capacitor/app` au projet pour ecouter les deep links.

### Etape 3 : Modifier `src/pages/AuthPage.tsx`

Changer `handleOAuth` pour utiliser le deep link comme `redirect_uri` :

```typescript
const DEEP_LINK_CALLBACK = "surplussavvy://auth/callback";

const handleOAuth = async (provider: "google" | "apple") => {
  const isCapacitor = !!(window as any).Capacitor;
  if (isCapacitor) {
    const params = new URLSearchParams({
      provider,
      redirect_uri: DEEP_LINK_CALLBACK,
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

### Etape 4 : Ecouter le deep link dans `src/main.tsx`

Ajouter un listener global qui intercepte le retour du deep link et injecte les tokens dans la session :

```typescript
import { App as CapApp } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';

CapApp.addListener('appUrlOpen', async ({ url }) => {
  // url = surplussavvy://auth/callback#access_token=...&refresh_token=...
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) return;

  const hash = url.substring(hashIndex + 1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    // onAuthStateChange dans useAuth detectera la session
    // et AuthPage redirigera vers /home
  }
});
```

### Etape 5 : Supprimer le listener `visibilitychange` devenu inutile

Le `useEffect` qui ecoute `visibilitychange` dans AuthPage n'est plus necessaire car les tokens arrivent directement via le deep link.

## Flux complet apres modification

```text
1. App Capacitor -> Bouton Google
2. -> window.location.href vers lovable.app/~oauth/initiate
      avec redirect_uri = surplussavvy://auth/callback
3. -> Safari s'ouvre, Google login
4. -> Callback vers surplussavvy://auth/callback#access_token=...
5. -> iOS intercepte le scheme "surplussavvy://"
6. -> Ouvre l'app, declenche l'event "appUrlOpen"
7. -> Le listener extrait les tokens du hash
8. -> supabase.auth.setSession() enregistre la session dans le WebView
9. -> onAuthStateChange se declenche, l'utilisateur est connecte
10. -> Redirection vers /home
```

## Resume des fichiers

| Fichier | Modification |
|---|---|
| `package.json` | Ajouter `@capacitor/app` comme dependance |
| `src/main.tsx` | Ajouter le listener `appUrlOpen` pour intercepter le deep link et injecter les tokens |
| `src/pages/AuthPage.tsx` | Changer `redirect_uri` en `surplussavvy://auth/callback`, supprimer le listener `visibilitychange` |

## Apres ces modifications

1. Exporter vers GitHub et faire `git pull`
2. `npm install` (pour installer `@capacitor/app`)
3. Configurer le URL Scheme dans Xcode (si pas deja fait)
4. `npx cap sync`
5. `npx cap run ios`

## Note importante

Si le proxy OAuth sur `lovable.app` refuse le `redirect_uri` avec un scheme custom (`surplussavvy://`), il faudra alors passer par une page intermediaire : le proxy redirige vers `lovable.app/auth-bridge#tokens`, et cette page redirige elle-meme vers `surplussavvy://auth/callback#tokens`. Cette approche sera a tester en premier lieu avec le scheme direct.

